// src/api/client.ts
import { treaty } from "@elysiajs/eden";
import type { ServerApp } from "@server/app";

// 同源基址（dev 用 Vite 代理 /api，prod 同源部署）
export const api = treaty<ServerApp>(window.location.origin);

/**
 * 统一解包后端 { success, data } 响应；失败直接抛出 data
 * 用法：const user = await unwrap(api.auth.login.post(body))
 */
export const unwrap = async <T extends { data: any; error: any }>(
  promise: Promise<T>,
): Promise<
  T["data"] extends { success: boolean; data: infer D } ? D : T["data"]
> => {
  const res = await promise;

  // 处理网络层或框架层错误 (Eden Treaty 捕获的错误)
  if (res.error) {
    // 抛出 formatError
    const errorData = res.error.value.data as any;
    throw errorData.message;
  }

  // 获取后端包装后的结果 { success, data }
  const payload = res.data;

  // 处理业务逻辑错误 (success: false)
  if (payload && typeof payload === "object" && "success" in payload) {
    if (payload.success === false) {
      throw payload.data; // 抛出真正的错误信息 { message, field }
    }
    // 返回业务数据 (success: true)
    // 推断出类型是后端 formatResponse 里的 response 内容
    return payload.data;
  }

  // 万一后端没有经过包装（虽然你有全局插件，但作为兜底）
  return payload;
};
