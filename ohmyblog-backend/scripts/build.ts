#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

type Platform = "win" | "linux" | "linux-musl" | "mac";

const TARGETS = {
	win: "bun-windows-x64",
	linux: "bun-linux-x64",
	"linux-musl": "bun-linux-x64-musl",
	mac: "bun-darwin-arm64", // Apple Silicon
} as const;

async function build(platform: Platform) {
	const distDir = join("scripts", "dist", platform);
	const target = TARGETS[platform];
	const exeName = platform === "win" ? "ohmyblog.exe" : "ohmyblog";

	console.log(`\n🔨 Building for ${platform}...`);

	// 1. 清理并创建输出目录（带重试机制）
	if (existsSync(distDir)) {
		let retries = 3;
		while (retries > 0) {
			try {
				await rm(distDir, { recursive: true, force: true });
				break;
			} catch (err) {
				retries--;
				if (retries === 0) {
					console.error(
						`   ❌ 无法删除 ${distDir}，请关闭该目录中的所有程序和文件资源管理器`,
					);
					throw err;
				}
				console.log(
					`   ⚠️  目录被占用，等待 2 秒后重试... (剩余 ${retries} 次)`,
				);
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		}
	}
	await mkdir(distDir, { recursive: true });

	// 2. 编译可执行文件
	// 图像处理由 Bun.Image (Bun 1.3.14+ 内置) 提供，无需额外的 native 模块拷贝
	console.log(`   Compiling executable...`);
	await Bun.build({
		entrypoints: ["./src/index.ts"],
		compile: {
			target,
			outfile: join(distDir, exeName),
		},
		minify: true,
		sourcemap: "none", // 生产环境不需要 sourcemap
	});

	// 3. 复制 db/drizzle 目录（包含迁移 SQL 文件）
	console.log(`   Copying db/drizzle...`);
	const drizzleSource = "db/drizzle";
	const drizzleDest = join(distDir, "db", "drizzle");
	await mkdir(join(distDir, "db"), { recursive: true });
	await cp(drizzleSource, drizzleDest, { recursive: true });

	// 4. 复制前端静态资源 (frontend-dist → distDir/public)
	console.log(`   Copying frontend dist (public/)...`);
	const frontendDistSrc = "frontend-dist";
	if (existsSync(frontendDistSrc)) {
		await cp(frontendDistSrc, join(distDir, "public"), { recursive: true });
	} else {
		console.warn(
			`   ⚠️  frontend-dist not found, skipping public/ copy. Run frontend build first.`,
		);
	}

	console.log(`✅ Build complete: ${distDir}/`);
}

// 主函数
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log("Usage: bun run scripts/build.ts <platform>");
		console.log("Platforms: win | linux | linux-musl | mac");
		process.exit(1);
	}

	const platform = args[0] as Platform;

	if (platform in TARGETS) {
		await build(platform);
	} else {
		console.error(`Unknown platform: ${platform}`);
		console.log("Available platforms: win, linux, linux-musl, mac");
		process.exit(1);
	}

	console.log(`\n🎉 Build completed for ${platform}!`);
}

main().catch((err) => {
	console.error("Build failed:", err);
	process.exit(1);
});
