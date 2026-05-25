// src/services/image.service.ts

import { mkdir } from "node:fs/promises";
import path from "node:path";

export const ImageService = {
	/**
	 * 优化并保存图片
	 * 使用 Bun.Image (Bun 1.3.14+ 内置) 提供高性能、零依赖的图像处理
	 * 编解码基于 libjpeg-turbo / spng / libwebp，几何变换走 Highway SIMD
	 *
	 * @param file 原始文件 (File 对象)
	 * @param targetPath 目标物理路径 (支持相对或绝对路径)
	 * @param isIcon 是否作为图标处理 (若为 true，则调整尺寸为 256x256 并转 PNG)
	 * @returns {Promise<string>} 返回保存后的绝对物理路径
	 */
	async optimizeAndSave(
		file: File,
		targetPath: string,
		isIcon: boolean = false,
	): Promise<string> {
		// 确保目标目录存在
		const absolutePath = path.resolve(targetPath);
		await mkdir(path.dirname(absolutePath), { recursive: true });

		// File 是 Blob 的子类，可直接调用 .image() 走零拷贝管道
		const pipeline = file.image();

		if (isIcon) {
			// 图标处理：强制 256x256（默认 lanczos3）并转 PNG
			await pipeline.resize(256, 256).png().write(absolutePath);
		} else {
			// 普通图片处理：宽度 > 1920 时等比缩到 1920，统一输出 WebP (quality 75)
			// withoutEnlargement 保证小图不会被放大
			await pipeline
				.resize(1920, undefined, { withoutEnlargement: true })
				.webp({ quality: 75 })
				.write(absolutePath);
		}

		return absolutePath;
	},
};
