// src/composables/validator.hook.ts
import { Value } from "@sinclair/typebox/value";
import type { TSchema } from "@sinclair/typebox";
import { useLang } from "@/composables/lang.hook";

/**
 * 专门存储验证正则的工具库
 */
export const VALIDATION_PATTERNS = {
  /**
   * Email 正则
   * 严谨匹配，要求必须有 @ 和带点的后缀
   */
  email:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
};

/**
 * 通用格式校验函数
 * @param format schema 中的 format 字段
 * @param value 输入的值
 */
export function validateByFormat(
  format: string | undefined,
  value: string,
): boolean {
  if (!format || !(format in VALIDATION_PATTERNS)) {
    return true;
  }

  const regex = VALIDATION_PATTERNS[format as keyof typeof VALIDATION_PATTERNS];
  return regex.test(value);
}

export function useValidator() {
  const { t } = useLang();

  /**
   * 统一校验逻辑
   * @param value 待校验的值
   * @param options 校验配置（必填、Schema等）
   */
  const validate = (
    value: string | number | undefined,
    options: {
      required?: boolean;
      schema?: TSchema;
    } = {},
  ) => {
    const { required, schema } = options;

    // 1. 必填校验
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim());

    if (required && isEmpty) {
      return {
        isValid: false,
        error: t("components.common.input.TipInput.required"),
      };
    }

    // 对于非必填且内容为空的字段，直接视作校验通过，跳过后续 Schema 校验
    if (!required && isEmpty) {
      return { isValid: true, error: "" };
    }

    // 2. Schema 校验
    if (schema) {
      // 字符串类型需要 trim，其他类型直接传入
      const validateValue = typeof value === "string" ? value.trim() : value;

      // A. 自定义格式校验 (仅对字符串类型)
      if (schema.format && typeof validateValue === "string") {
        if (!validateByFormat(schema.format, validateValue)) {
          const errorKey = (schema as any).error || `invalid_${schema.format}`;
          return {
            isValid: false,
            error: t(`common.validation.${errorKey}`),
          };
        }
      }

      // B. TypeBox 基础校验 (过滤 "Unknown format" 警告/错误)
      const errors = [...Value.Errors(schema, validateValue)];
      const realErrors = errors.filter(
        (err) => !err.message.includes("Unknown format"),
      );

      const error = realErrors[0];
      if (error) {
        // 优先从 schema 的自定义 error 属性中获取国际化标识符
        const errorKey = (error.schema as any).error || error.message;
        return {
          isValid: false,
          error: errorKey ? t(`common.validation.${errorKey}`) : "",
        };
      }
    }

    return { isValid: true, error: "" };
  };

  return {
    validate,
  };
}
