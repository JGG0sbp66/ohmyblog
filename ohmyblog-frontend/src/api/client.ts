import { treaty } from '@elysiajs/eden';
import type { ServerApp } from '@server/app';

// 同源基址（dev 用 Vite 代理 /api，prod 同源部署）
export const api = treaty<ServerApp>('');

/**
 * 统一解包后端 { success, data } 响应；失败直接抛出 data
 * 用法：const user = await unwrap(api.auth.login.post(body))
 */
export const unwrap = async <T>(promise: Promise<unknown>): Promise<T> => {
  const res: any = await promise;
  if (res && typeof res === 'object' && 'success' in res) {
    if (res.success === false) throw res.data ?? res;
    return res.data as T;
  }
  // 后端若未包装，直接返回原值
  return res as T;
};
