import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./db/schema.ts",
    out: "./db/drizzle",
    dialect: "sqlite",
    dbCredentials: {
        url: "./data/sqlite.db",
    },
});
