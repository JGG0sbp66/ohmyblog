// src/services/image.service.ts

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Transformer } from "@napi-rs/image";

export const ImageService = {
	/**
	 * 优化并保存图片
	 * 使用 @napi-rs/image (Rust) 提供高性能、零系统依赖的图像处理
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

		// 创建转换器
		const transformer = new Transformer(buffer);
		const { width, height } = await transformer.metadata();

		let processed: Buffer;

		if (isIcon) {
			// 图标处理：强制 128x128 并转 PNG
			processed = await transformer
				.resize(128, 128, 2) // 2 为 Lanczos3 算法
				.png();
		} else {
			// 普通图片处理：
			// 1. 如果宽度大于 1920，则等比例缩小到 1920 (withoutEnlargement 逻辑)
			if (width > 1920) {
				const ratio = 1920 / width;
				const newHeight = Math.round(height * ratio);
				await transformer.resize(1920, newHeight, 2);
			}

			// 2. 统一转换为 WebP 并进行质量优化 (75)
			processed = await transformer.webp(75);
		}

		await Bun.write(absolutePath, processed);

		return absolutePath;
	},
};
