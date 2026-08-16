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
// 密码来源按模式二选一：
//   交互（TTY）   系统生成随机密码并打印 —— 想设自己惯用的密码，登录后
//                到后台设置页改，那里走浏览器的完整输入栈。此前交互分支
//                在 raw mode 下按字节拼密码，中文等多字节字符会拼成乱码
//                哈希，把「用中文密码的站长」锁在这个自救工具要救的门外面；
//                不再接收手输，这一类问题从结构上消失
//   管道 / 重定向  读 stdin 作为自定义密码（echo "newpass" | ...），整块
//                utf8 解码，无字节边界问题，供自动化使用

import { twoFactorDao } from "../daos/two-factor.dao";
import { userDao } from "../daos/user.dao";
import { ResetPasswordDTO } from "../dtos/auth.dto";

// 长度约束直接读 DTO，不另抄一份数字：HTTP 接口、前端 TipInput 的表单校验、
// 这里，三处共用同一个 schema，改 DTO 就全都跟着变。
//
// TypeBox 把这两个字段标成可选。schema 里真没写约束时就不施加对应限制，
// 而不是回填一个猜出来的默认值 —— 那等于又把数字硬编码回来了
const { minLength, maxLength } = ResetPasswordDTO.properties.newPassword;

/**
 * 按 DTO 的约束校验密码长度
 * @param value 待校验的明文密码
 * @returns 不合规时返回给用户看的原因，合规返回 null
 */
const validatePasswordLength = (value: string): string | null => {
	if (minLength !== undefined && value.length < minLength) {
		return `密码长度不能少于 ${minLength} 位`;
	}
	if (maxLength !== undefined && value.length > maxLength) {
		return `密码长度不能超过 ${maxLength} 位`;
	}
	return null;
};

/** 生成字母表：剔除 0/1/l/I/O/o 等形近字符，万一需要手抄不至于抄错 */
const PASSWORD_ALPHABET =
	"23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
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

/** 生成随机密码（crypto 级随机，长度落在 DTO 约束内） */
function generatePassword(): string {
	let out = "";
	for (let i = 0; i < GENERATED_LENGTH; i++) {
		out += PASSWORD_ALPHABET[randomIndex(PASSWORD_ALPHABET.length)];
	}
	return out;
}

/** 从 stdin 读自定义密码（管道 / 重定向喂入时用），整块 utf8 解码 */
async function readPasswordFromStdin(): Promise<string> {
	const chunks: Uint8Array[] = [];
	for await (const chunk of process.stdin) chunks.push(chunk as Uint8Array);
	return Buffer.concat(chunks).toString("utf8").trim();
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

	// 2. 定密码：交互模式生成随机值，管道模式读 stdin
	const password = process.stdin.isTTY
		? generatePassword()
		: await readPasswordFromStdin();

	const lengthError = validatePasswordLength(password);
	if (lengthError) {
		console.error(`✗ ${lengthError}`);
		process.exit(1);
	}

	// 3. 落库（先落库再打印：保证打出来的密码一定是存进去的那个）
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

	// 4. 输出。就这两行 —— 打印顺序放在所有写操作之后，中途失败不会
	//    印出一个没有生效的密码。已签发的 auth_token 不受影响：项目的
	//    JWT 没有黑名单，改密码不会踢掉现有会话
	console.log(`账号：${target.username} <${target.email}>`);
	console.log(`新密码：${password}`);
}
