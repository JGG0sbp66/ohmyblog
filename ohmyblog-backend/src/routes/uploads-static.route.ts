// src/routes/uploads-static.route.ts
import { stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { Elysia, NotFoundError } from "elysia";
import { UPLOADS_DIR } from "../constants";

/**
 * 上传资源静态服务（GET /api/uploads/*）
 *
 * uploads 是运行时可变目录：头像/图标/横幅会被原地覆盖，新文章的
 * posts/<uuid>/ 目录随时新增。因此不能交给 @elysiajs/static 托管：
 * 它内部的 fileCache 只按路径缓存 Response、不校验 mtime，文件覆盖
 * 变大后会继续发旧的（截断的）字节；生产模式下还会在启动时对目录
 * 做快照，启动后新增的文件没有路由。这里改为每次请求实时读磁盘，
 * 对覆盖、新增、变大、全局钩子都天然免疫。
 */
export const uploadsStaticRoute = new Elysia({
	name: "uploadsStaticRoute",
}).get("/uploads/*", async ({ params }) => {
	// 上传资源文件名可能含非 ASCII 字符（如中文平台名生成的社交图标），
	// 浏览器会对其做 percent 编码，路由参数拿到的是编码后的形态，先解码
	let relative: string;
	try {
		relative = decodeURIComponent(params["*"]);
	} catch {
		// 非法编码序列（如孤立的 %）不当 500 处理，直接按不存在走
		throw new NotFoundError();
	}

	// 防路径穿越：resolve 后必须仍位于 uploads 目录内
	// （.. 段、编码后的分隔符在 resolve 之后都会暴露为逃逸出根目录）
	const uploadsRoot = resolve(UPLOADS_DIR);
	const physical = resolve(uploadsRoot, relative);
	if (!physical.startsWith(uploadsRoot + sep)) {
		throw new NotFoundError();
	}

	// 实时 stat：不存在或不是普通文件（目录等）一律 404，不落任何缓存
	const info = await stat(physical).catch(() => null);
	if (!info?.isFile()) throw new NotFoundError();

	return new Response(Bun.file(physical), {
		headers: {
			// 浏览器侧缓存一天；上传后的即时刷新靠前端 URL 上的 ?t= 时间戳
			"Cache-Control": "public, max-age=86400",
		},
	});
});
