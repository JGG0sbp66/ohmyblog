// src/bootstrap/cli/run.ts
// 命令行子命令分发。
//
// 做成主程序的子命令而不是 scripts/ 下的独立脚本，是因为 build.ts 的
// entrypoints 只有 src/index.ts，scripts/ 不会被编译进单文件产物；而二进制和
// Docker 部署里既没有源码也没有 bun，偏偏那才是最需要带外重置的场景。
const CLI_COMMANDS = new Set(["reset-password"]);

/**
 * 解析 argv 中的子命令并执行，处理完直接 process.exit，不进入服务器启动流程。
 * 没有命中子命令时原样返回，继续正常启动。
 */
export async function runCliCommand(): Promise<void> {
	const commandIndex = process.argv.findIndex((arg) => CLI_COMMANDS.has(arg));
	if (commandIndex === -1) return;

	const command = process.argv[commandIndex];
	const commandArgs = process.argv.slice(commandIndex + 1);

	try {
		if (command === "reset-password") {
			const { runResetPassword } = await import("./reset-password");
			await runResetPassword(commandArgs);
		}
		process.exit(0);
	} catch (err) {
		console.error("✗ 命令执行失败：", err);
		process.exit(1);
	}
}
