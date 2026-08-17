import { Elysia } from "elysia";
import {
	TWO_FACTOR_CHALLENGE_EXPIRED_MESSAGE,
	TWO_FACTOR_EXHAUSTED_MESSAGE,
} from "../../db/constants/two-factor.constants";
import {
	TwoFactorDisableDTO,
	TwoFactorTokenDTO,
	TwoFactorVerifyDTO,
} from "../dtos/two-factor.dto";
import { authPlugin } from "../plugins/auth.plugin";
import { BusinessError } from "../plugins/errors";
import { twoFactorService } from "../services/two-factor.service";
import { issueAuthCookie } from "../utils/auth-cookie";
import { isDemoUser } from "../utils/demo";
import { getClientIp } from "../utils/getClientIp";
import { CHALLENGE_COOKIE_NAME } from "../utils/two-factor-challenge";

/**
 * 设置类接口的统一前置检查：必须已登录，且不能是演示模式的虚拟身份。
 *
 * 没有用 role: "admin" 宏，也没有用 ensureAdminIfExists：
 *   - 这些接口操作的是「当前登录者自己的」两步验证，不是管理他人的资源，
 *     所以条件是「已登录」而不是「是管理员」，将来开放普通用户注册时无需改动；
 *   - ensureAdminIfExists 的语义是「系统还没 admin 时放行」，那是 setup
 *     向导的豁免，这里不需要。
 *
 * 演示身份在库里查不到，放进来只会在 service 层抛 404，不如在门口就拦掉。
 */
// biome-ignore lint/suspicious/noExplicitAny: Elysia context is dynamically extended by plugins
const ensureRealUser = ({ user }: any) => {
	if (!user) {
		throw new BusinessError("未登录或会话已过期", { status: 401 });
	}
	if (isDemoUser(user)) {
		throw new BusinessError("演示模式不支持该操作", { status: 403 });
	}
};

export const twoFactorRoute = new Elysia({ name: "twoFactorRoute" }).group(
	"/two-factor",
	{
		detail: { tags: ["Two Factor (两步验证)"] },
	},
	(app) =>
		app
			.use(authPlugin)
			// === 登录第二步：校验验证码 / 恢复码并真正签发 auth_token ===
			// 这个端点不要求已登录 —— 调用者此刻正处于「密码已过、token 未发」的
			// 半登录状态，身份由 httpOnly 的 challenge cookie 承载。
			.post(
				"/verify",
				async ({ body, cookie, jwt, request, server }) => {
					const challengeCookie = cookie[CHALLENGE_COOKIE_NAME];
					const challengeValue = challengeCookie?.value;
					const challengeId =
						typeof challengeValue === "string" ? challengeValue : undefined;
					const ip = getClientIp({ request, server });

					let user: Awaited<
						ReturnType<typeof twoFactorService.verifyChallenge>
					>;
					try {
						user = await twoFactorService.verifyChallenge(
							challengeId,
							body.code,
							ip,
						);
					} catch (err) {
						// challenge 已作废（过期或次数用尽）时清除 cookie，
						// 留着只会让用户在第二步一直失败。两个文案都来自共享常量
						if (
							err instanceof BusinessError &&
							(err.message === TWO_FACTOR_EXHAUSTED_MESSAGE ||
								err.message === TWO_FACTOR_CHALLENGE_EXPIRED_MESSAGE)
						) {
							challengeCookie?.remove();
						}
						throw err;
					}

					// 验证通过：清除 challenge cookie，签发 auth_token
					challengeCookie?.remove();

					await issueAuthCookie({ jwt, cookie, user });

					return {
						message: "登录成功",
						user: {
							uuid: user.uuid,
							username: user.username,
							role: user.role,
						},
					};
				},
				{
					detail: {
						summary: "登录第二步 - 校验两步验证码",
						description:
							"接受验证器 App 的 6 位验证码，或任一未使用的恢复码。身份来自登录第一步下发的 challenge cookie。",
					},
					body: TwoFactorVerifyDTO,
				},
			)
			// === 查询当前状态（设置页展示用）===
			.get(
				"/status",
				async ({ user }) => {
					if (!user) {
						throw new BusinessError("未登录或会话已过期", { status: 401 });
					}

					// 演示身份在库里不存在，返回一个「未启用」的固定状态，
					// 否则设置页一进来就会看到 404 报错
					if (isDemoUser(user)) {
						return {
							enabled: false,
							enabledAt: null,
							recoveryCodesRemaining: 0,
						};
					}

					return await twoFactorService.getStatus(user.uuid);
				},
				{
					detail: { summary: "查询两步验证状态" },
				},
			)
			// === 设置第一步：生成密钥与二维码 ===
			.post(
				"/setup",
				async ({ user }) => {
					return await twoFactorService.startSetup(user!.uuid);
				},
				{
					beforeHandle: ensureRealUser,
					detail: {
						summary: "开始绑定两步验证",
						description:
							"生成新密钥并返回二维码内容。此时尚未启用，需要再调用 /enable 提交一次验证码确认。",
					},
				},
			)
			// === 设置第二步：确认并启用 ===
			.post(
				"/enable",
				async ({ user, body }) => {
					const { recoveryCodes } = await twoFactorService.enable(
						user!.uuid,
						body.token,
					);

					return {
						message: "两步验证已启用",
						recoveryCodes,
					};
				},
				{
					beforeHandle: ensureRealUser,
					detail: {
						summary: "确认并启用两步验证",
						description:
							"校验通过后启用，并一次性返回恢复码明文（之后无法再次读取）。",
					},
					body: TwoFactorTokenDTO,
				},
			)
			// === 关闭两步验证 ===
			.post(
				"/disable",
				async ({ user, body }) => {
					await twoFactorService.disable(user!.uuid, body.password);
					return { message: "两步验证已关闭" };
				},
				{
					beforeHandle: ensureRealUser,
					detail: { summary: "关闭两步验证（需密码确认）" },
					body: TwoFactorDisableDTO,
				},
			)
			// === 重新生成恢复码 ===
			.post(
				"/recovery-codes",
				async ({ user, body }) => {
					const { recoveryCodes } =
						await twoFactorService.regenerateRecoveryCodes(
							user!.uuid,
							body.token,
						);

					return {
						message: "恢复码已重新生成",
						recoveryCodes,
					};
				},
				{
					beforeHandle: ensureRealUser,
					detail: {
						summary: "重新生成恢复码",
						description: "旧恢复码整批作废，需要提交一次当前验证码。",
					},
					body: TwoFactorTokenDTO,
				},
			),
);
