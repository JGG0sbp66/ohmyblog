import { api, unwrap } from './client';

// 健康检查示例：GET /api/health
export const getHealthStatus = () => unwrap(api.api.health.get());

