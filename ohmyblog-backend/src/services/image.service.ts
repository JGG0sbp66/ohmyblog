// src/services/image.service.ts

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { transform } from "bun-image-turbo";

export const ImageService = {
	/**
	 * 优化并保存图片
	 * 自动处理图片格式转换（图标转 PNG，普通图片转 WebP）并确保目标目录存在
	 *
	 * @param file 原始文件 (File 对象)
	 * @param targetPath 目标物理路径 (支持相对或绝对路径)
	 * @param isIcon 是否作为网站图标处理 (若为 true，则调整尺寸为 128x128 并转为 PNG)
	 * @returns {Promise<string>} 返回保存后的绝对物理路径
	 */
	async optimizeAndSave(
		file: File,
		targetPath: string,
		isIcon: boolean = false,
	): Promise<string> {
		const buffer = Buffer.from(await file.arrayBuffer());

		// 确保目标目录存在
		const absolutePath = path.resolve(targetPath);
		await mkdir(path.dirname(absolutePath), { recursive: true });

		let processed: Uint8Array;

		if (isIcon) {
			processed = await transform(buffer, {
				resize: {
					width: 128,
					height: 128,
					fit: "inside",
				},
				output: {
					format: "png",
				},
			});
		} else {
			// 如果是博客普通图片：统一转 WebP
			processed = await transform(buffer, {
				output: {
					format: "webp",
					webp: { quality: 85 },
				},
			});
		}

		await Bun.write(absolutePath, processed);

		return absolutePath;
	},
};
