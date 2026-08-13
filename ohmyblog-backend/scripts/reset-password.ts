// scripts/reset-password.ts
//
// 带外的密码重置通道，直接改数据库，不经过任何 HTTP 接口。
//
// 存在的理由：忘记密码流程依赖 SMTP，而 SMTP 未配置恰好是新装站点的默认
// 状态 —— 那种情况下站长一旦忘了密码就彻底进不去。两步验证同理，验证器
// 丢了也没有别的自救办法。这个脚本要求能登录服务器（即已经拥有最高权限），
// 所以不构成新的攻击面。
//
// 用法：
//   bun run reset-password                      # 交互式，自动选中唯一的管理员
//   bun run reset-password <用户名或邮箱>        # 指定账号
//   bun run reset-password <账号> --disable-2fa  # 顺便关掉两步验证（验证器丢了时用）
//
// 密码通过交互式输入，不作为命令行参数传，避免留在 shell 历史里。
// 也支持管道：echo "newpass" | bun run reset-password admin

import { twoFactorDao } from "../src/daos/two-factor.dao";
import { userDao } from "../src/daos/user.dao";

/** 与 auth.dto.ts 里 password 的约束保持一致 */
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 50;

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

async function main() {
	const args = process.argv.slice(2);
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
	if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
		console.error(`✗ 密码长度需在 ${PASSWORD_MIN}~${PASSWORD_MAX} 之间`);
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
	process.exit(0);
}

main().catch((err) => {
	console.error("✗ 重置失败：", err);
	process.exit(1);
});
