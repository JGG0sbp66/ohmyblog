import { Elysia } from "elysia";

// ---------------------------------------------
// 失败响应包装
// ---------------------------------------------
const formatError = ({ code, error }: any) => {

    return {
        success: false,
        // 直接使用 error 对象原本的信息
        // 如果是校验错误，Elysia 会自动生成 "Expected string..." 之类的技术描述
        // 如果是你手动抛的 error(400, "文章不存在")，这里就是 "文章不存在"
        message: error.message,

        // 可选：如果是校验错误，就把详细字段信息带上，方便调试，不是校验错误就是 null
        data: code === 'VALIDATION' ? error.all : null
    };
};

// ---------------------------------------------
// 成功响应包装
// ---------------------------------------------
const formatResponse = ({ response }: any) => {
    // 特殊类型直接放行（文件流、Blob 等）
    if (response instanceof Response) return response;

    // 防止二次包装 (比如 onError 返回的已经是格式化好的对象)
    if (response && typeof response === 'object' && 'success' in response) {
        return response;
    }

    return {
        success: true,
        message: "ok",
        data: response
    };
};

export const responsePlugin = (app: Elysia) => app
    .onError(formatError)
    .mapResponse(formatResponse);