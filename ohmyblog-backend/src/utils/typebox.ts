// src/utils/typebox.ts
//
// TypeBox / Elysia schema 相关工具
import { t } from "elysia";

/**
 * 把一个 `readonly string[]` 字面量数组映射为 TypeBox 的 TLiteral 元组。
 * 必须保留每个字面量类型才能让 t.Union 推导出 union of literals 而不是 string。
 *
 * 一般不需要直接调用，优先使用 `tStringEnum`。
 */
export const literalsOf = <T extends readonly string[]>(values: T) =>
	values.map((v) => t.Literal(v)) as {
		-readonly [K in keyof T]: T[K] extends string
			? ReturnType<typeof t.Literal<T[K]>>
			: never;
	};

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
) => t.Union(literalsOf(values), options);
