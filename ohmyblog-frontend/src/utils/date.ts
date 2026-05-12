// src/utils/date.ts

type RawDate = string | number | Date | null | undefined;

/**
 * 格式化为短时间：MM/DD HH:mm
 * 用于列表卡片等空间紧凑的场景
 * @returns 格式化字符串，raw 为空时返回 ""
 */
export function formatShortTime(raw: RawDate): string {
  if (!raw) return "";
  return new Date(raw as string | number | Date).toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 格式化为完整日期时间：YYYY/MM/DD HH:mm
 * 用于详情面板等需要完整时间信息的场景
 * @returns 格式化字符串，raw 为空时返回 "-"
 */
export function formatDateTime(raw: RawDate): string {
  if (!raw) return "-";
  return new Date(raw as string | number | Date).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 格式化为纯日期：YYYY/MM/DD
 * 用于入驻时间、发布日期等只需日期的场景
 * @param locale 可选 locale（如 "zh-CN"），默认跟随浏览器
 * @returns 格式化字符串，raw 为空时返回 ""
 */
export function formatDate(raw: RawDate, locale?: string): string {
  if (!raw) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(raw as string | number | Date));
}
