// src/services/image.service.ts

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const ImageService = {
	/**
	 * 极简处理：仅转格式并保存
	 * @param file 原始文件
	 * @param targetPath 目标路径
	 * @param isIcon 是否为网站图标
	 */
	async optimizeAndSave(
		file: File,
		targetPath: string,
		isIcon: boolean = false,
	) {
		const buffer = Buffer.from(await file.arrayBuffer());

		// 确保目标目录存在
		const absolutePath = path.resolve(targetPath);
		await mkdir(path.dirname(absolutePath), { recursive: true });

		const pipeline = sharp(buffer).rotate();

		if (isIcon) {
			await pipeline
				.resize(128, 128, { fit: "inside", withoutEnlargement: true })
				.png()
				.toFile(absolutePath);
		} else {
			// 如果是博客普通图片：统一转 WebP
			await pipeline.webp({ quality: 85 }).toFile(absolutePath);
		}

		return absolutePath;
	},
};
