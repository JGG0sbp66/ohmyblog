import { Elysia } from "elysia";
import { responsePlugin } from "./plugins/response.js";

const app = new Elysia().use(responsePlugin).listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
