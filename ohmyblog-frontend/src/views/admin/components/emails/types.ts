// src/views/admin/components/emails/types.ts
import type { TEmailLog } from "@server/db/table/email-log";
import type { TEmailLogQueryDTO } from "@server/dtos/email.dto";
import type { TEmailLogType } from "@/api/shared";

export type { TEmailLogType };

/**
 * 列表项类型
 *
 * 直接继承自后端的数据库实体类型 TEmailLog。
 * 这样后端删除字段（如之前的 ip, triggeredBy）时，前端会自动同步。
 * 唯一需要特殊处理的是 createdAt，因为在网络传输后它通常是 string 或 number。
 */
export interface EmailLogItem extends Omit<TEmailLog, "createdAt"> {
  createdAt: string | number | Date;
}

/** 过滤条件，复用后端 query DTO 的部分字段 */
export type EmailLogFilters = Pick<TEmailLogQueryDTO, "type" | "isRead">;
