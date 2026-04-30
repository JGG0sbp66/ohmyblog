// src/utils/emailColors.ts
import { formatHex } from "culori";

/**
 * 将 OKLCH 颜色转换为 sRGB 十六进制字符串。
 * 使用 culori 库确保转换精度和色域映射的准确性。
 */
function oklchToHex(L: number, C: number, H: number): string {
	// culori 的 oklch 接受的对象属性名为 l, c, h
	const hex = formatHex({ mode: "oklch", l: L, c: C, h: H });
	return hex || "#000000";
}

export interface EmailColorPalette {
	accent: string;
	fg: string;
	/** 对应前端的 #00000080，在白底上的视觉效果 */
	fgMuted: string;
	/** 对应前端的 opacity-40 效果 */
	fgSubtle: string;
	/** 基础背景色 */
	bgMuted: string;
	/** 对应前端 /50 的背景色，更淡 */
	bgMutedSoft: string;
	/** 基础边框色 */
	border: string;
	/** 对应前端 /50 的边框色 */
	borderSoft: string;
	/** 对应前端 /30 的极淡边框色，用于分割线 */
	borderLight: string;
}

/**
 * 根据色相值 (0–360) 生成邮件安全的十六进制色板。
 * 精确镜像前端 tailwind.css 中的 light-mode 变量定义。
 */
export function hueToEmailColors(hue: number): EmailColorPalette {
	return {
		accent: oklchToHex(0.6, 0.18, hue),
		fg: oklchToHex(0.2, 0.03, hue),
		// 中性灰色
		fgMuted: "#737373", 
		// 极低彩度 (0.02)，让它看起来是灰色，但由于有色相，会比纯灰更耐看
		fgSubtle: oklchToHex(0.7, 0.02, hue), 
		bgMuted: oklchToHex(0.95, 0.03, hue),
		bgMutedSoft: oklchToHex(0.98, 0.01, hue),
		border: oklchToHex(0.9, 0.02, hue),
		borderSoft: oklchToHex(0.95, 0.01, hue),
		borderLight: oklchToHex(0.97, 0.005, hue),
	};
}



