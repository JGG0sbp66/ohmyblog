// src/dtos/config.dto.ts
import { type Static, t } from "elysia";

// 创建配置 DTO
export const ConfigCreateDTO = t.Object({
    configKey: t.String({
        minLength: 1,
        maxLength: 100,
        description: "配置键名",
        examples: ["app.theme"],
    }),
    configValue: t.Any({
        description: "配置值（JSON）",
    }),
    description: t.Optional(t.String({
        maxLength: 255,
        description: "配置描述",
    })),
    isPublic: t.Optional(t.Boolean({
        description: "是否公开给前端",
    })),
});

// 更新配置 DTO（全部可选，路由中做至少一项校验）
export const ConfigUpdateDTO = t.Object({
    configValue: t.Optional(t.Any({
        description: "配置值（JSON）",
    })),
    description: t.Optional(t.String({
        maxLength: 255,
        description: "配置描述",
    })),
    isPublic: t.Optional(t.Boolean({
        description: "是否公开给前端",
    })),
});

export type TConfigCreateDTO = Static<typeof ConfigCreateDTO>;
export type TConfigUpdateDTO = Static<typeof ConfigUpdateDTO>;

