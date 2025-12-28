import { Elysia } from "elysia";
import { healthService } from "../services/healthService";

export const healthRoute = (app: Elysia) =>
    app.group('/health', {
        detail: {
            tags: ['健康检查']
        }
    }, (app) => app.get(
        "",
        () => {
            return healthService.getSystemStatus();
        },
        {
            detail: {
                summary: "系统健康检查",
                description: "获取系统健康状态，包括当前运行的版本信息"
            }
        }
    ));