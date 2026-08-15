// src/services/captcha/captcha.service.ts
//
// 验证码配置的读取。配置本身和 smtp 一样存在 config 表里，读写都走通用的
// /api/config 接口 —— 这个模块只负责一件通用接口做不了的事：
//
//   登录页、忘记密码页、友链申请表单都是未登录状态，而 captcha 配置
//   isPublic=false，它们读不到。可它们又必须拿到 siteKey 才能把验证框渲染
//   出来。所以这里挑出「渲染验证框需要的那几个字段」单独对外。
//
// 校验逻辑（拿 token 去问服务商）在同目录的 siteverify.ts。

import {
	CAPTCHA_FAILED_MESSAGE,
	type TCaptchaProvider,
	type TCaptchaScene,
} from "../../../db/constants/captcha.constants";
import { configDao } from "../../daos/config.dao";
import type { TCaptchaConfigUpsertDTO } from "../../dtos/config.dto";
import { BusinessError } from "../../plugins/errors";
import { logger } from "../../plugins/logger.plugin";
import { type CaptchaVerifyResult, verifyWithProvider } from "./siteverify";

/** 落库的配置形状，即 CaptchaConfigUpsertDTO 的 configValue 部分 */
type StoredCaptchaConfig = TCaptchaConfigUpsertDTO["configValue"];

/** 当前真正生效的那家服务商及其密钥 */
interface ActiveCaptcha {
	provider: TCaptchaProvider;
	siteKey: string;
	secretKey: string;
}

class CaptchaService {
	private logger = logger.withTag("CaptchaService");

	/**
	 * 上一次「密钥不完整」告警的内容指纹，用来避免重复刷屏。
	 *
	 * 配错是个持续状态而不是一次性事件：不去重的话，登录页每刷新一次、每提交
	 * 一次都会往 data/logs/ 里写一行，同一句话能刷出几万条。指纹变了（站长改了
	 * 配置）才再报一次，站长排查时看到的就是「每次配错报一条」。
	 */
	private lastIncompleteWarning: string | null = null;

	/**
	 * 读出落库的原始配置（含所有服务商的 secret）。
	 *
	 * private 是刻意的：带 secret 的对象不要流出本模块，将来的校验逻辑也在
	 * 这个 class 里，同样通过它取密钥。
	 *
	 * 走 configDao.findByKey，那层已有 60s TTL 缓存
	 * （daos/caches/config.cache.ts），写路径由 dao 自己失效，不用另建缓存。
	 */
	private async getStored(): Promise<StoredCaptchaConfig | null> {
		const record = await configDao.findByKey("captcha");
		return (record?.configValue as StoredCaptchaConfig | undefined) ?? null;
	}

	/**
	 * 解析出当前生效的服务商和密钥，没生效则返回 null。
	 *
	 * 「验证码生没生效」和「该用哪家的哪把钥匙」是同一个问题的两面，所以
	 * 合成一个方法：调用方拿到 null 就是没生效，拿到对象就能直接用，不会
	 * 出现「判断说生效了、取钥匙时却是空的」这种缝。
	 *
	 * 两条判定：
	 *   - 总开关关着 → 没生效
	 *   - 当前服务商的两把 key 缺任何一把 → 没生效。这种配置填一半的状态
	 *     不报错、不拦保存，把站长挡在保存那一步的代价远大于短暂失去防护；
	 *     但前后端必须对此看法一致，否则会出现「界面上有验证框、后端却不认」
	 *     或者反过来，两种都是死路，所以判断只在这里做一次
	 *
	 * credentials 里其余几家是为了换服务商时不丢 key 留着的，任何时候都不
	 * 该被读进校验流程 —— 只认 provider 指向的那家。
	 *
	 * @param stored 落库的原始配置
	 */
	private getActive(stored: StoredCaptchaConfig | null): ActiveCaptcha | null {
		if (!stored?.enabled) return null;

		const credential = stored.credentials?.[stored.provider];
		if (!credential?.siteKey || !credential.secretKey) {
			// 站长自己配了一半，不是攻击。记一条能查的日志，行为上当作未启用
			const signature = `${stored.provider}:${Boolean(credential?.siteKey)}:${Boolean(credential?.secretKey)}`;
			if (signature !== this.lastIncompleteWarning) {
				this.lastIncompleteWarning = signature;
				this.logger.warn(
					{
						provider: stored.provider,
						hasSiteKey: Boolean(credential?.siteKey),
						hasSecretKey: Boolean(credential?.secretKey),
					},
					"验证码开关已打开但当前服务商的密钥不完整，按未启用处理",
				);
			}
			return null;
		}

		// 配置恢复正常，把指纹清掉：下次再配错还应该报出来
		this.lastIncompleteWarning = null;

		return {
			provider: stored.provider,
			siteKey: credential.siteKey,
			secretKey: credential.secretKey,
		};
	}

	/**
	 * 给前端的公开配置：只有渲染验证框所需的那几个字段，不含任何 secret。
	 *
	 * 没生效时 provider 和 siteKey 都是 null —— 此时前端什么都不该渲染，
	 * 给它一个「看起来像配好了」的值只会误导。字段可空但形状始终是一个，
	 * 不会让 Eden 推出联合类型逼前端到处收窄（同 auth.service 的 getMe）。
	 *
	 * scenes 在没生效时一律置 false，前端因此只看 scenes[场景] 就能决定显不
	 * 显示，不用再自己与 enabled 相与。
	 */
	async getPublicConfig() {
		const stored = await this.getStored();
		const active = this.getActive(stored);

		return {
			enabled: active !== null,
			provider: active?.provider ?? null,
			siteKey: active?.siteKey ?? null,
			scenes: {
				login: active !== null && Boolean(stored?.scenes?.login),
				forgotPassword:
					active !== null && Boolean(stored?.scenes?.forgotPassword),
				friendApply: active !== null && Boolean(stored?.scenes?.friendApply),
			},
		};
	}

	/**
	 * 某个入口提交上来的 token 必须过验证码，否则抛错。
	 *
	 * 三个入口的 handler 里第一行调它。放第一行是有讲究的：**必须在查账号
	 * 之前**。反过来的话，「验证码错」和「账号不存在」会走出不同的响应路径，
	 * 接口就又变成了账号枚举器。
	 *
	 * 该入口没开启验证码时直接返回，什么都不做 —— 所以调用方不需要自己先
	 * 判断开没开。
	 *
	 * 失败一律抛同一句 CAPTCHA_FAILED_MESSAGE：没带 token、token 过期、
	 * 服务商判定为机器人、服务商不可达，对外看起来完全一样。具体原因只进
	 * 日志，给站长排查用。
	 *
	 * @param scene 入口名
	 * @param token 前端验证框产出的一次性凭证
	 * @param ip 客户端 IP
	 */
	async ensureVerified(
		scene: TCaptchaScene,
		token: string | undefined,
		ip: string,
	): Promise<void> {
		const stored = await this.getStored();
		const active = this.getActive(stored);

		// 总开关没开、密钥不全、或这个入口没勾上 —— 都当作不需要验证
		if (!active || !stored?.scenes?.[scene]) return;

		if (!token) {
			this.logger.warn({ scene, ip }, "人机验证：请求未携带 token");
			throw new BusinessError(CAPTCHA_FAILED_MESSAGE, { status: 400 });
		}

		const result = await verifyWithProvider({
			provider: active.provider,
			secretKey: active.secretKey,
			token,
			ip,
			// 只有 provider 是 recaptcha 时才用得上，其余两家会忽略
			minScore: stored.recaptchaMinScore,
		});

		if (!result.passed) {
			this.logger.warn(
				{ scene, ip, provider: active.provider, errorCodes: result.errorCodes },
				"人机验证未通过",
			);
			throw new BusinessError(CAPTCHA_FAILED_MESSAGE, { status: 400 });
		}
	}

	/**
	 * 后台「测试」按钮：拿表单里当前填的密钥直接试一次，不读数据库、不影响
	 * 已保存的配置。与 /email/test-smtp 同一个思路 —— 先试通了再保存，
	 * 而不是存进去之后靠登录页去撞。
	 *
	 * 这也是唯一能真正验出密钥对不对的办法：保存时是没法校验的，因为
	 * 服务商只在「有一个真实 token」的前提下才肯回答。
	 *
	 * @returns 原样返回服务商的结论、错误码，以及 reCAPTCHA 实际打出的分
	 */
	async testCredential(params: {
		provider: TCaptchaProvider;
		secretKey: string;
		token: string;
		ip: string;
		minScore?: number;
	}): Promise<CaptchaVerifyResult> {
		const result = await verifyWithProvider(params);
		this.logger.info(
			{ provider: params.provider, passed: result.passed },
			"验证码配置测试",
		);
		return result;
	}
}

export const captchaService = new CaptchaService();
