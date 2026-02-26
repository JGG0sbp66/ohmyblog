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
	console.log(`   Compiling executable...`);
	await Bun.build({
		entrypoints: ["./src/index.ts"],
		compile: {
			target,
			outfile: join(distDir, exeName),
		},
		minify: true,
		sourcemap: "linked",
	});

	// 3. 复制 db/drizzle 目录（包含迁移 SQL 文件）
	console.log(`   Copying db/drizzle...`);
	const drizzleSource = "db/drizzle";
	const drizzleDest = join(distDir, "db", "drizzle");
	await mkdir(join(distDir, "db"), { recursive: true });
	await cp(drizzleSource, drizzleDest, { recursive: true });

	// 4. 复制 bun-image-turbo 的 native 二进制文件
	console.log(`   Copying native modules for bun-image-turbo...`);
	const nativeConfigs = {
		win: {
			pkg: "bun-image-turbo-win32-x64-msvc",
			file: "image-turbo.win32-x64-msvc.node",
		},
		linux: {
			pkg: "bun-image-turbo-linux-x64-gnu",
			file: "image-turbo.linux-x64-gnu.node",
		},
		"linux-musl": {
			pkg: "bun-image-turbo-linux-x64-musl",
			file: "image-turbo.linux-x64-musl.node",
		},
		mac: {
			pkg: "bun-image-turbo-darwin-arm64",
			file: "image-turbo.darwin-arm64.node",
		},
	};

	const config = nativeConfigs[platform];
	const nativeSource = join("node_modules", config.pkg, config.file);

	if (existsSync(nativeSource)) {
		console.log(`     Bundling native module ${config.file}...`);
		await cp(nativeSource, join(distDir, config.file));
	} else {
		console.warn(
			`   ⚠️  Native module for ${platform} not found at ${nativeSource}. Binary may not run correctly.`,
		);
	}

	// 5. 创建 README
	const readme = `# OhMyBlog ${platform.toUpperCase()} Distribution

## 运行方式

\`\`\`bash
./${exeName}
\`\`\`

## 环境变量

首次运行时会自动生成 data/.env 文件，你可以修改其中的配置。

## 目录结构

- ${exeName} - 主程序
- ${config.file} - 图片处理 native 模块 (必须在主程序同级目录)
- db/drizzle/ - 数据库迁移文件
- data/ - 运行时数据目录（自动创建）
  - .env - 环境变量配置
  - sqlite.db - SQLite 数据库
  - uploads/ - 上传文件
  - logs/ - 日志文件

## 注意事项

1. 不要删除 db/drizzle 目录，它包含数据库结构定义
2. 不要删除 ${config.file} 文件，它是图片处理必需的 native 模块
3. data 目录会在首次运行时自动创建
4. 此发行版仅适用于 ${platform} 平台，不可跨平台使用
`;

	await Bun.write(join(distDir, "README.md"), readme);

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
