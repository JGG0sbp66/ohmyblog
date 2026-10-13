// tools/release.mjs
// 一条命令完成发版：同步前后端 package.json 版本 -> 提交 -> 打 tag -> 推送
// 用法（在 ohmyblog-backend 下）：
//   bun run release v1.4.0
// 也可以直接在仓库根跑：bun tools/release.mjs v1.4.0
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const [, , versionArg] = process.argv;

function die(msg) {
	console.error(`❌ ${msg}`);
	process.exit(1);
}

let sh = (cmd) => execSync(cmd, { stdio: "pipe", encoding: "utf8" }).trim();

// --- 参数校验 ---
const version = versionArg?.replace(/^v/, "");
if (!version || !/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(version)) {
	die(`版本号格式不对：${versionArg ?? "(空)"}，应为 x.y.z（如 1.4.0）`);
}
const tag = `v${version}`;

// 比较 x.y.z 主版本段（预发布后缀不参与比较）
const cmp = (a, b) => {
	const [pa, pb] = [a, b].map((v) => v.split("-")[0].split(".").map(Number));
	for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
	return 0;
};

// --- 环境校验 ---
// 脚本位于仓库根 tools/，上溯一级即仓库根；路径全部基于脚本自身定位，
// 不依赖 cwd（既支持从后端 bun run release，也支持从根目录直跑）
const root = join(import.meta.dir, "..");
// 后续 git 命令一律钉在仓库根执行，避免 status/add 只看到某个子树
sh = (cmd) => execSync(cmd, { stdio: "pipe", encoding: "utf8", cwd: root }).trim();

if (sh("git status --porcelain")) {
	die("工作区有未提交的改动，先提交或撤销后再发版");
}
if (sh(`git tag -l ${tag}`)) {
	die(`tag ${tag} 已存在，换个版本号`);
}

// 发布基线以 tag 为准：新版本必须不低于已发布的最高版本。
// 一个 tag 都没有时不限制（首发可以任意定，因为什么都没发布过）
const semverLike = /^\d+\.\d+\.\d+(-[\w.-]+)?$/;
const released = sh("git tag -l v*")
	.split(/\r?\n/)
	.map((t) => t.trim().slice(1))
	.filter((v) => semverLike.test(v));
const maxReleased = released.reduce((max, v) => (max === null || cmp(v, max) > 0 ? v : max), null);
if (maxReleased !== null && cmp(version, maxReleased) < 0) {
	die(`不允许低于已发布的最高版本：已发布 ${maxReleased}，收到 ${version}`);
}

// --- 写入新版本 ---
// 只替换顶层 "version" 字段（package.json 里唯一的出现位置），
// 不做 JSON.parse + stringify，保留后端 tab / 前端 2 空格的原有缩进风格
const files = [
	join(root, "ohmyblog-backend/package.json"),
	join(root, "ohmyblog-frontend/package.json"),
];

let changed = false;
for (const file of files) {
	const text = readFileSync(file, "utf8");
	const oldVersion = /^\s*"version":\s*"([^"]+)"/m.exec(text)?.[1];
	if (!oldVersion) die(`${file} 里没找到 "version" 字段`);
	if (oldVersion === version) continue;
	writeFileSync(file, text.replace(/"version":\s*"[^"]+"/, `"version": "${version}"`));
	console.log(`📝 ${file}：${oldVersion} -> ${version}`);
	changed = true;
}

if (!changed) die(`前后端版本已经是 ${version}，无需发版`);

// --- 提交 + 打 tag + 推送 ---
// 提交信息遵循仓库的 Conventional Commits 约定，CI Release Notes 会归入「其他」
sh("git add -A");
sh(`git commit -m "chore(release): 发布 ${tag}"`);
sh(`git tag ${tag}`);
sh(`git push origin HEAD ${tag}`);

console.log(`\n✅ ${tag} 已推送，等 GitHub Actions 构建发布即可`);
