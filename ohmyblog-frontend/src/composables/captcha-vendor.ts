// src/composables/captcha-vendor.ts
//
// 三家验证码服务商的脚本加载与 API 形状。
//
// 从 CaptchaWidget.vue 里拆出来，是因为这一块全是「厂商是怎么规定的」——
// 脚本地址、全局变量名、render 参数的拼写，跟组件的渲染逻辑没有关系，
// 混在一起会让组件读起来像一份 API 文档。

import type { TCaptchaProvider } from "@/api/shared";

/**
 * Turnstile 和 hCaptcha 的 JS API 形状完全一致（hCaptcha 早于 Turnstile，
 * 后者基本照抄了它的接口），所以共用一个类型。
 */
interface BoxVendor {
  render(
    el: HTMLElement,
    opts: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ): string;
  reset(widgetId?: string): void;
  remove(widgetId?: string): void;
}

/** reCAPTCHA v3 没有可见的框，只有一个「按需要一个 token」的方法 */
interface ScoreVendor {
  ready(cb: () => void): void;
  execute(siteKey: string, opts: { action: string }): Promise<string>;
}

declare global {
  interface Window {
    turnstile?: BoxVendor;
    hcaptcha?: BoxVendor;
    grecaptcha?: ScoreVendor;
  }
}

/**
 * 服务商的交互形态，决定组件走哪条路径：
 *   box   —— 页面上有个框，用户点一下产出 token（Turnstile / hCaptcha）
 *   score —— 没有框，提交那一刻现算一个 token（reCAPTCHA v3）
 */
export const vendorKind = (provider: TCaptchaProvider): "box" | "score" =>
  provider === "recaptcha" ? "score" : "box";

/**
 * 验证框的高度，用来给容器留位。
 *
 * 脚本是异步加载的，不留位的话框出现那一刻整个表单会往下跳一截。
 * 数值取各家默认尺寸（Turnstile 65px，hCaptcha 78px）。
 */
export const BOX_HEIGHT: Record<string, number> = {
  turnstile: 65,
  hcaptcha: 78,
};

/** 脚本地址。reCAPTCHA 的 siteKey 要拼进 URL，所以按 key 分别加载 */
const scriptUrl = (provider: TCaptchaProvider, siteKey: string) => {
  switch (provider) {
    case "turnstile":
      return "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    case "hcaptcha":
      return "https://js.hcaptcha.com/1/api.js?render=explicit";
    case "recaptcha":
      return `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
  }
};

/** 已经加载过的脚本，按 URL 去重 —— 同一个 URL 不重复插入 */
const loaded = new Map<string, Promise<void>>();

/**
 * 加载某家的脚本，返回的 Promise 在脚本可用时 resolve。
 *
 * @param provider 服务商
 * @param siteKey 站点密钥（只有 reCAPTCHA 用得上，它要拼进脚本地址）
 */
export const loadVendorScript = (
  provider: TCaptchaProvider,
  siteKey: string,
): Promise<void> => {
  const url = scriptUrl(provider, siteKey);

  const existing = loaded.get(url);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = url;
    el.async = true;
    el.defer = true;
    el.onload = () => resolve();
    el.onerror = () => {
      // 加载失败不留在缓存里，下次还能重试（最常见的原因是网络到不了
      // 服务商，而那往往是暂时的）
      loaded.delete(url);
      reject(new Error(`验证码脚本加载失败：${url}`));
    };
    document.head.appendChild(el);
  });

  loaded.set(url, promise);
  return promise;
};

/** 取全局对象。脚本加载完之前是 undefined */
export const getBoxVendor = (provider: TCaptchaProvider): BoxVendor | null =>
  (provider === "turnstile" ? window.turnstile : window.hcaptcha) ?? null;

export const getScoreVendor = (): ScoreVendor | null =>
  window.grecaptcha ?? null;
