// src/utils/url.ts

/** 判断链接是否为 HTTP(S) 外链 */
export const isExternalLink = (url: string): boolean =>
  /^https?:\/\//i.test(url.trim());

/** 将用户输入的 friends 或 /friends 统一规范化为 /friends 形式的站内路径 */
export const normalizeInternalPath = (url: string): string =>
  `/${url.trim().replace(/^\/+/, "")}`;
