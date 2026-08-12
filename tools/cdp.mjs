#!/usr/bin/env bun
/**
 * tools/cdp.mjs
 *
 * 用 Chrome DevTools Protocol 遥控本机浏览器的小工具。仓库里没有测试框架，
 * 这个脚本用来在真实浏览器里手动验证交互（尤其是拖拽这类只能看不能断言的行为）。
 *
 * 前提：浏览器带 --remote-debugging-port 启动（见 `launch` 子命令）。
 *
 * 常用：
 *   bun tools/cdp.mjs launch                       # 用独立临时 profile 起一个带调试端口的浏览器
 *   bun tools/cdp.mjs targets                      # 列出可连接的页面
 *   bun tools/cdp.mjs open <url>                   # 让第一个页面导航过去
 *   bun tools/cdp.mjs eval "<js>"                  # 在页面里求值（支持 await）
 *   bun tools/cdp.mjs rect "<selector>"            # 元素的视口矩形
 *   bun tools/cdp.mjs drag <x1> <y1> <x2> <y2>     # 按住拖到目标点再松手（真实指针事件）
 *   bun tools/cdp.mjs press <x> <y>                # 只按下（配合 move/release 分步观察拖拽中的状态）
 *   bun tools/cdp.mjs move <x> <y>                 # 拖拽中移动
 *   bun tools/cdp.mjs release <x> <y>              # 松手
 *   bun tools/cdp.mjs shot <file.png>              # 截图
 *
 * 说明：
 * - `--match=<子串>` 可指定要连的页面（默认第一个 http(s) 页面）
 * - `--port=<端口>` 默认 9222
 * - drag 走 Input.dispatchMouseEvent，浏览器会派发**可信**的 pointer/mouse 事件，
 *   和真人操作走同一条路径；Runtime.evaluate 里 new PointerEvent 派发的是不可信事件，
 *   验证不了 setPointerCapture、touch-action 这类只对可信事件生效的行为。
 */

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v = "true"] = a.slice(2).split("=");
      return [k, v];
    }),
);
const positional = args.filter((a) => !a.startsWith("--"));
const [command, ...rest] = positional;

const PORT = Number(flags.port ?? 9222);
const HOST = flags.host ?? "127.0.0.1";

/** 极简 CDP 客户端：一条 WebSocket + 自增 id 配对回包 */
class CDP {
  #ws;
  #id = 0;
  #pending = new Map();

  constructor(ws) {
    this.#ws = ws;
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      const resolver = this.#pending.get(msg.id);
      if (!resolver) return; // 事件通知，这个工具用不上
      this.#pending.delete(msg.id);
      if (msg.error) resolver.reject(new Error(JSON.stringify(msg.error)));
      else resolver.resolve(msg.result);
    });
  }

  static async attach() {
    const targets = await listTargets();
    const pages = targets.filter(
      (t) => t.type === "page" && /^https?:/.test(t.url),
    );
    const match = flags.match;
    const target = match
      ? pages.find((t) => t.url.includes(match) || t.title?.includes(match))
      : pages[0];
    if (!target) {
      throw new Error(
        `没有可连接的页面（match=${match ?? "-"}）。当前目标：\n` +
          targets.map((t) => `  [${t.type}] ${t.url}`).join("\n"),
      );
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });
    const cdp = new CDP(ws);
    cdp.target = target;
    return cdp;
  }

  send(method, params = {}) {
    const id = ++this.#id;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#ws.send(JSON.stringify({ id, method, params }));
    });
  }

  /** 在页面里求值，返回 JSON 化后的结果 */
  async eval(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ??
          JSON.stringify(result.exceptionDetails),
      );
    }
    return result.result.value;
  }

  close() {
    this.#ws.close();
  }
}

async function listTargets() {
  const res = await fetch(`http://${HOST}:${PORT}/json/list`);
  if (!res.ok) throw new Error(`CDP 列表请求失败：${res.status}`);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 一次完整的按住—移动—松手。
 *
 * 分步移动而不是一步到位：拖拽逻辑普遍依赖连续的 pointermove（阈值判定、
 * 越线换序都要多帧才看得出来），一步跳过去等于什么都没拖。
 */
async function drag(cdp, x1, y1, x2, y2, { steps = 24, holdMs = 260 } = {}) {
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: x1,
    y: y1,
    button: "left",
    buttons: 1,
    clickCount: 1,
  });
  // 长按一小会儿：触摸端要靠长按激活，鼠标端也顺手留出抬起动画的时间
  await sleep(holdMs);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: Math.round(x1 + (x2 - x1) * t),
      y: Math.round(y1 + (y2 - y1) * t),
      button: "left",
      buttons: 1,
    });
    await sleep(16);
  }

  await sleep(80);
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: x2,
    y: y2,
    button: "left",
    buttons: 0,
    clickCount: 1,
  });
}

function launch() {
  const candidates = [
    process.env.CDP_BROWSER,
    `${process.env.LOCALAPPDATA}\\imput\\Helium\\Application\\chrome.exe`,
    `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ].filter(Boolean);

  const fs = require("node:fs");
  const exe = candidates.find((p) => fs.existsSync(p));
  if (!exe) throw new Error(`找不到浏览器可执行文件，试过：\n${candidates.join("\n")}`);

  const profile =
    flags.profile ?? `${process.env.TEMP}\\ohmyblog-cdp-profile`;
  const url = rest[0] ?? "about:blank";

  // 必须用独立 user-data-dir：目标浏览器已经在跑的话，同 profile 再启动只会把
  // 参数转交给已有进程，调试端口根本不会打开。
  const child = require("node:child_process").spawn(
    exe,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      url,
    ],
    { detached: true, stdio: "ignore" },
  );
  child.unref();
  console.log(`已启动 ${exe}\n  调试端口 ${PORT}\n  临时 profile ${profile}`);
}

const main = async () => {
  switch (command) {
    case "launch":
      launch();
      return;

    case "targets": {
      const targets = await listTargets();
      for (const t of targets) console.log(`[${t.type}] ${t.title} — ${t.url}`);
      return;
    }

    case "open": {
      const cdp = await CDP.attach();
      await cdp.send("Page.enable");
      await cdp.send("Page.navigate", { url: rest[0] });
      await sleep(Number(flags.wait ?? 1500));
      console.log(await cdp.eval("document.title + ' | ' + location.href"));
      cdp.close();
      return;
    }

    case "eval": {
      const cdp = await CDP.attach();
      const value = await cdp.eval(`(async () => (${rest.join(" ")}))()`);
      console.log(
        typeof value === "string" ? value : JSON.stringify(value, null, 2),
      );
      cdp.close();
      return;
    }

    case "rect": {
      const cdp = await CDP.attach();
      const value = await cdp.eval(
        `(() => { const el = document.querySelector(${JSON.stringify(rest[0])});
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; })()`,
      );
      console.log(JSON.stringify(value, null, 2));
      cdp.close();
      return;
    }

    case "drag": {
      const [x1, y1, x2, y2] = rest.map(Number);
      const cdp = await CDP.attach();
      await drag(cdp, x1, y1, x2, y2, {
        steps: Number(flags.steps ?? 24),
        holdMs: Number(flags.hold ?? 260),
      });
      console.log(`已拖拽 (${x1},${y1}) → (${x2},${y2})`);
      cdp.close();
      return;
    }

    // press / move / release 是把 drag 拆开的三步，用来在**拖拽进行中**停下来观察：
    // 按下之后进程退出，浏览器里的按键状态还留着，下一条命令接着往前推。
    // 拖起时的放大与阴影只有这样才量得到。
    case "press": {
      const [x, y] = rest.map(Number);
      const cdp = await CDP.attach();
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x,
        y,
        button: "left",
        buttons: 1,
        clickCount: 1,
      });
      cdp.close();
      console.log(`已按下 (${x},${y})`);
      return;
    }

    case "move": {
      const [x, y] = rest.map(Number);
      const cdp = await CDP.attach();
      const steps = Number(flags.steps ?? 8);
      for (let i = 1; i <= steps; i++) {
        await cdp.send("Input.dispatchMouseEvent", {
          type: "mouseMoved",
          x,
          y: Math.round(y - (steps - i) * 0.5),
          button: "left",
          buttons: 1,
        });
        await sleep(16);
      }
      cdp.close();
      console.log(`已移动到 (${x},${y})`);
      return;
    }

    case "release": {
      const [x, y] = rest.map(Number);
      const cdp = await CDP.attach();
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x,
        y,
        button: "left",
        buttons: 0,
        clickCount: 1,
      });
      cdp.close();
      console.log(`已松手 (${x},${y})`);
      return;
    }

    /**
     * 触摸拖拽：长按 → 拖 → 松手，用来验证移动端的长按激活与滚动拦截。
     * 手指必须先按住不动一小会儿（默认 320ms），这正是 useListDrag 区分
     * 「想滚页面」和「想拖卡片」的依据。
     */
    case "touchdrag": {
      const [x1, y1, x2, y2] = rest.map(Number);
      const cdp = await CDP.attach();
      const steps = Number(flags.steps ?? 20);
      const point = (x, y) => [{ x, y, radiusX: 12, radiusY: 12, force: 1 }];

      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: point(x1, y1),
      });
      await sleep(Number(flags.hold ?? 320));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: point(
            Math.round(x1 + (x2 - x1) * t),
            Math.round(y1 + (y2 - y1) * t),
          ),
        });
        await sleep(16);
      }
      await sleep(80);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      cdp.close();
      console.log(`已触摸拖拽 (${x1},${y1}) → (${x2},${y2})`);
      return;
    }

    case "shot": {
      const cdp = await CDP.attach();
      const { data } = await cdp.send("Page.captureScreenshot", {
        format: "png",
      });
      const file = rest[0] ?? "screenshot.png";
      require("node:fs").writeFileSync(file, Buffer.from(data, "base64"));
      console.log(`已保存 ${file}`);
      cdp.close();
      return;
    }

    default:
      console.log(
        "用法：bun tools/cdp.mjs <launch|targets|open|eval|rect|drag|shot> [参数] [--port=9222] [--match=子串]",
      );
  }
};

main().catch((error) => {
  console.error(String(error?.message ?? error));
  process.exit(1);
});
