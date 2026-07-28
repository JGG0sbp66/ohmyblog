// src/api/health.api.ts
import { api, unwrap } from "./client";

// GET /api/health
export const getHealth = () => unwrap(api.api.health.get());

// GET /api/health/update
export const checkUpdate = () => unwrap(api.api.health.update.get());
