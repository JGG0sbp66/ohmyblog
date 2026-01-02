import { api, unwrap } from "./client";

// GET /api/health
export const getHealthStatus = () => unwrap(api.api.health.get());
