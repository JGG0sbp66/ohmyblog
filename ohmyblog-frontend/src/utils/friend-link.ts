// src/utils/friend-link.ts

/**
 * 从友链 URL 提取展示用域名，去掉 www. 前缀
 * @example getFriendLinkDomain("https://www.example.com/foo") → "example.com"
 */
export function getFriendLinkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * 取站点名称首字大写，用于无头像时的占位符
 * @example getFriendLinkInitial("My Blog") → "M"
 */
export function getFriendLinkInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}
