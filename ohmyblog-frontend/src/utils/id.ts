/**
 * 生成简单的唯一 ID，用于列表渲染时的 key 或本地状态管理。
 * 结合随机字符串和时间戳，确保在单次运行环境下的唯一性。
 */
export const generateId = () =>
  Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
