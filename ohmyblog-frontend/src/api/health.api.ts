// src/api/health.api.ts
import { api, unwrap } from "./client";

// GET /api/health
export const getHealth = () => unwrap(api.api.health.get());
