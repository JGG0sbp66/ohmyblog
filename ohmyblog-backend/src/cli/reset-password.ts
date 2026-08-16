// src/cli/reset-password.ts
//
// 带外的密码重置通道，直接改数据库，不经过任何 HTTP 接口。
//
// 存在的理由：忘记密码流程依赖 SMTP，而 SMTP 未配置恰好是新装站点的默认
// 状态 —— 那种情况下站长一旦忘了密码就彻底进不去。两步验证同理，验证器
// 丢了也没有别的自救办法。这条通道要求能登录服务器（即已经拥有最高权限），
// 所以不构成新的攻击面。
//
// **必须挂在 src/index.ts 的子命令上，不能做成 scripts/ 下的独立脚本**：
// scripts/ 里的东西不会被 Bun.build 编译进单文件产物（build.ts 的
// entrypoints 只有 src/index.ts），而二进制和 Docker 部署里既没有源码也
// 没有 bun —— 恰恰是最需要这条通道的场景。
//
// 用法：
//   ./ohmyblog reset-password                      # 二进制部署
//   docker exec -it -u 10001 <容器> /app/ohmyblog reset-password
//   bun run reset-password                         # 源码开发环境
//
// 可选参数：
//   <用户名或邮箱>   指定账号，省略时自动选中唯一的管理员
//   --disable-2fa   顺便关掉两步验证（验证器也丢了时用）
//
// 密码一律由系统生成并打印，不接收任何形式的输入：此前交互分支在 raw
// mode 下按字节拼密码，中文等多字节字符会拼成乱码哈希，把「用中文密码的
// 站长」锁在这个自救工具要救的门外面。想设自己惯用的密码，登录后到后台
// 设置页改 —— 那里走浏览器的完整输入栈，没有字节边界问题。

import { twoFactorDao } from "../daos/two-factor.dao";
import { userDao } from "../daos/user.dao";

/** 生成字母表：剔除 0/1/l/I/O/o 等形近字符，万一需要手抄不至于抄错 */
const PASSWORD_ALPHABET =
	"23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
/** 生成长度。须落在 ResetPasswordDTO 的 6~50 约束内（auth.dto.ts） */
const GENERATED_LENGTH = 20;

/** 拒绝采样取 [0, max) 的均匀随机数，消掉 256 % max 的模偏差 */
function randomIndex(max: number): number {
	// 只接受落在完整重复段内的字节值，其余丢弃重取
	const limit = 256 - (256 % max);
	const buf = new Uint8Array(1);
	do {
		crypto.getRandomValues(buf);
	} while (buf[0] >= limit);
	return buf[0] % max;
}

/** 生成随机密码（crypto 级随机） */
function generatePassword(): string {
	let out = "";
	for (let i = 0; i < GENERATED_LENGTH; i++) {
		out += PASSWORD_ALPHABET[randomIndex(PASSWORD_ALPHABET.length)];
	}
	return out;
}

/**
 * 执行密码重置流程。
 *
 * @param args 子命令后面的参数（不含 "reset-password" 本身）
 */
export async function runResetPassword(args: string[]) {
	const disableTwoFactor = args.includes("--disable-2fa");
	const identifier = args.find((arg) => !arg.startsWith("--"));

	// 1. 定位账号：给了标识就按标识找，否则取唯一的管理员
	const target = identifier
		? await userDao.findByIdentifier(identifier)
		: await userDao.findAdmin();

	if (!target) {
		console.error(
			identifier
				? `✗ 找不到用户：${identifier}`
				: "✗ 库里还没有管理员账号，请先通过初始化向导创建",
		);
		process.exit(1);
	}

	// 2. 生成并落库（先落库再打印：保证打出来的密码一定是存进去的那个）
	const password = generatePassword();
	const passwordHash = await Bun.password.hash(password);
	await userDao.update(target.uuid, { passwordHash });

	if (disableTwoFactor && target.twoFactorEnabled) {
		await twoFactorDao.deleteByUser(target.uuid);
		await userDao.update(target.uuid, {
			twoFactorEnabled: false,
			twoFactorSecret: null,
			twoFactorEnabledAt: null,
			twoFactorLastUsedCounter: null,
		});
	}

	// 3. 输出。就这两行。已签发的 auth_token 不受影响：项目的 JWT 没有
	//    黑名单，改密码不会踢掉现有会话
	console.log(`账号：${target.username} <${target.email}>`);
	console.log(`新密码：${password}`);
}
