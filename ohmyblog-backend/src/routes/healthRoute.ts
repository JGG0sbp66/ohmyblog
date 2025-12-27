import { Elysia } from "elysia";
import { healthService } from "../services/healthService";

export const healthRoute = (app: Elysia) =>
    app.get("/health", () => {
        return healthService.getSystemStatus();
    });