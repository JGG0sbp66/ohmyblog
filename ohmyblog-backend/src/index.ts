// src/index.ts
// 进程入口：只做调度——子命令 → 装配应用 → 监听 → 生命周期与横幅。
// 应用装配细节见 bootstrap/app.ts，后台任务与优雅关闭见 bootstrap/lifecycle.ts。

import { createApp } from "./bootstrap/app";
import { runCliCommand } from "./bootstrap/cli/run";
import { printStartupBanner, startLifecycle } from "./bootstrap/lifecycle";
import { config } from "./env";

// 命令行子命令必须在建服务器之前处理，处理完直接退出，不监听端口
await runCliCommand();

const app = await createApp();

app.listen(config.PORT);

startLifecycle();
printStartupBanner(app);

// 供 Eden（前端 treaty）使用，见 app.d.ts；不要在此添加运行时代码
export type { App } from "./bootstrap/app";
