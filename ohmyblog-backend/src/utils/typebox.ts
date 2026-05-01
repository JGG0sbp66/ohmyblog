// src/utils/typebox.ts
//
// TypeBox / Elysia schema 相关工具
import { t } from "elysia";

/**
 * 由字面量数组生成 `t.Union(TLiteral[])` schema。
 *
 * @example
 *   const Theme = tStringEnum(["light", "dark", "auto"] as const, {
 *     description: "主题模式",
 *   });
 *   // 等价于 t.Union([t.Literal("light"), t.Literal("dark"), t.Literal("auto")], { ... })
 *
 * 也可以直接传 `as const` 数组（如 db/constants 里的 `emailLogTypes`），
 * 这样字面量集合的 SSOT 就放在常量数组里，schema 会自动跟随。
 */
export const tStringEnum = <T extends readonly string[]>(
	values: T,
	options?: Parameters<typeof t.Union>[1],
) => t.Unsafe<T[number]>(t.Union(values.map((v) => t.Literal(v)), options));

