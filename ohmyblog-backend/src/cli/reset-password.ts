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
// 密码通过交互式输入，不作为命令行参数传，避免留在 shell 历史里。
// 也支持管道：echo "newpass" | ./ohmyblog reset-password admin

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

/**
 * 从终端读一行密码，输入过程回显为 *。
 *
 * 不是 TTY（例如被管道喂数据）时退化为直接读 stdin，方便自动化调用。
 */
async function readSecret(promptText: string): Promise<string> {
	const stdin = process.stdin;

	if (!stdin.isTTY) {
		const chunks: Uint8Array[] = [];
		for await (const chunk of stdin) chunks.push(chunk as Uint8Array);
		return Buffer.concat(chunks).toString("utf8").trim();
	}

	process.stdout.write(promptText);
	stdin.setRawMode(true);
	stdin.resume();

	return await new Promise<string>((resolve, reject) => {
		let value = "";

		const onData = (chunk: Buffer) => {
			for (const byte of chunk) {
				// Ctrl+C
				if (byte === 3) {
					cleanup();
					process.stdout.write("\n已取消\n");
					process.exit(130);
				}
				// 回车 / 换行 → 结束输入
				if (byte === 13 || byte === 10) {
					cleanup();
					process.stdout.write("\n");
					resolve(value);
					return;
				}
				// 退格
				if (byte === 8 || byte === 127) {
					if (value.length > 0) {
						value = value.slice(0, -1);
						process.stdout.write("\b \b");
					}
					continue;
				}
				// 忽略其余控制字符，避免方向键之类把乱码塞进密码
				if (byte < 32) continue;

				value += String.fromCharCode(byte);
				process.stdout.write("*");
			}
		};

		const cleanup = () => {
			stdin.setRawMode(false);
			stdin.pause();
			stdin.off("data", onData);
			stdin.off("error", onError);
		};

		const onError = (err: Error) => {
			cleanup();
			reject(err);
		};

		stdin.on("data", onData);
		stdin.on("error", onError);
	});
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

	console.log(`目标账号：${target.username} <${target.email}>`);
	if (target.twoFactorEnabled && !disableTwoFactor) {
		console.log(
			"提示：该账号启用了两步验证，改完密码登录时仍需验证码。\n" +
				"      验证器也丢了的话，加 --disable-2fa 一起关掉。",
		);
	}

	// 2. 读新密码
	const password = await readSecret("新密码：");
	const lengthError = validatePasswordLength(password);
	if (lengthError) {
		console.error(`✗ ${lengthError}`);
		process.exit(1);
	}

	if (process.stdin.isTTY) {
		const confirm = await readSecret("再输一次：");
		if (confirm !== password) {
			console.error("✗ 两次输入不一致");
			process.exit(1);
		}
	}

	// 3. 落库
	const passwordHash = await Bun.password.hash(password);
	await userDao.update(target.uuid, { passwordHash });
	console.log("✓ 密码已重置");

	if (disableTwoFactor && target.twoFactorEnabled) {
		await twoFactorDao.deleteByUser(target.uuid);
		await userDao.update(target.uuid, {
			twoFactorEnabled: false,
			twoFactorSecret: null,
			twoFactorEnabledAt: null,
			twoFactorLastUsedCounter: null,
		});
		console.log("✓ 两步验证已关闭，恢复码已全部清除");
	} else if (disableTwoFactor) {
		console.log("· 该账号本来就没开两步验证，跳过");
	}

	// 已签发的 auth_token 不受影响：项目的 JWT 没有黑名单，改密码不会踢掉
	// 现有会话。真要强制下线，改 data/.env 里的 JWT_SECRET 并重启
	console.log("\n现在可以用新密码登录了。");
}
