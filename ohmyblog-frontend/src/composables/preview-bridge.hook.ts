// src/composables/preview-bridge.hook.ts
import type { TAnnouncementConfigUpsertDTO } from "@server/dtos/config.dto";

/**
 * 后台预览联动通道
 *
 * 后台外观页的预览是一个真实的前台 iframe（`AppearancePreview.vue` 直接加载首页地址），
 * 它是独立文档、独立 JS 运行时，因此也是**独立的 Pinia 实例** —— 父页面改 store，
 * iframe 里的 store 不会跟着动。主题色之所以能实时联动，靠的是 localStorage 的
 * storage 事件跨文档（见 `theme.hook.ts` 里 useStorage 的注释），而不是 store 本身。
 *
 * 这里用同源的 BroadcastChannel 补上同样的通道，专门传「尚未保存的草稿」：
 * 后台表单一边改一边广播，iframe 里的前台接收后直接覆盖 store，做到所见即所得。
 * 相比走 localStorage 的好处是不会往访客本地塞任何东西。
 */

const CHANNEL_NAME = "omb-preview-draft";

/** 可以被预览联动的草稿字段（按需扩展） */
export type TPreviewDraft = {
  announcement?: TAnnouncementConfigUpsertDTO["configValue"];
};

type TPreviewMessage =
  | { type: "draft"; draft: TPreviewDraft }
  | { type: "request" };

const supported = typeof BroadcastChannel !== "undefined";

/**
 * 当前文档是否被嵌在 iframe 里
 *
 * 只有预览 iframe 才应该接受草稿覆盖，正常访问的前台一律忽略。
 * 跨源嵌入不用担心：BroadcastChannel 本身就是同源隔离的，别人的页面发不进来。
 */
const isEmbedded = (() => {
  try {
    return window.self !== window.top;
  } catch {
    // 读 window.top 抛异常 = 被跨源页面嵌着，同样不接受草稿
    return false;
  }
})();

// --- 发送端（后台） ---

/** 最近一次广播的草稿，用于响应 iframe 重载后的补发请求 */
let lastDraft: TPreviewDraft = {};
let publisher: BroadcastChannel | null = null;

function ensurePublisher(): BroadcastChannel | null {
  if (!supported) return null;
  if (publisher) return publisher;

  publisher = new BroadcastChannel(CHANNEL_NAME);
  publisher.onmessage = (event: MessageEvent<TPreviewMessage>) => {
    // 预览 iframe 重载（如切换语言、切换视口）后会主动索要一次草稿，
    // 否则它会退回服务端已保存的旧值，未保存的改动看着像丢了
    if (event.data?.type === "request") {
      publisher?.postMessage({ type: "draft", draft: lastDraft });
    }
  };
  return publisher;
}

/**
 * 广播一份草稿给预览 iframe（增量合并，不会清掉别的字段）
 */
export function publishPreviewDraft(patch: TPreviewDraft) {
  const channel = ensurePublisher();
  lastDraft = { ...lastDraft, ...patch };
  channel?.postMessage({ type: "draft", draft: lastDraft });
}

// --- 接收端（前台） ---

/**
 * 订阅草稿；非 iframe 环境下是空操作
 * @returns 是否真的建立了订阅
 */
export function onPreviewDraft(handler: (draft: TPreviewDraft) => void) {
  if (!supported || !isEmbedded) return false;

  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<TPreviewMessage>) => {
    if (event.data?.type === "draft") handler(event.data.draft);
  };
  // 自己刚加载完，向后台要一次当前草稿
  channel.postMessage({ type: "request" });

  return true;
}
