import { Elysia } from "elysia";

// ---------------------------------------------
// 失败响应包装
// ---------------------------------------------
const formatError = ({ code, error }: any) => {
    if (code === "VALIDATION") {
        // error.all 是一个包含所有错误详情的数组
        // 我们遍历它，只提取 "字段" 和 "错误信息"
        const formattedErrors = error.all.map((err: any) => {
            return {
                // err.path 通常是 "/password" 或 "/body/email"
                // 我们把开头的 "/" 去掉，看起来更干净
                field: err.path.slice(1) || "unknown",
                message: err.message,
            };
        });

        return {
            success: false,
            // data 里放详细的字段错误列表，方便前端在输入框底下标红
            data: {
                message: "请求参数验证失败",
                field: formattedErrors,
            },
        };
    }

    return {
        success: false,
        data: {
            // 手动抛的 error(400, "文章不存在")，这里就是 "文章不存在"
            message: error.message,
        },
    };
};

// ---------------------------------------------
// 成功响应包装
// ---------------------------------------------
const formatResponse = ({ response, set }: any) => {
    // 如果是错误响应，直接放行
    if (set.status >= 400) {
        return response;
    }

    // 特殊类型直接放行（文件流、Blob 等）
    if (response instanceof Response) return response;

    // 防止二次包装 (比如 onError 返回的已经是格式化好的对象)
    if (response && typeof response === "object" && "success" in response) {
        return response;
    }

    return {
        success: true,
        data: response,
    };
};

export const responsePlugin = new Elysia({ name: "responsePlugin" })
    .onError({ as: "global" }, formatError)
    .mapResponse({ as: "global" }, formatResponse);
