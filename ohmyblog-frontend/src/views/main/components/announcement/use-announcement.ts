// src/views/main/components/announcement/use-announcement.ts
import { computed } from "vue";
import { useStorage } from "@vueuse/core";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";

/**
 * 公告在前台的共享读取逻辑
 *
 * 桌面侧边栏卡片、移动端横幅、详情弹窗三处共用，避免「是否展示」「标题回落」
 * 这类判断散落三份各写一遍。
 */

/** 已关闭公告的签名存这里 */
const STORAGE_KEY = "announcement-dismissed";

/**
 * FNV-1a，输出 36 进制短串
 *
 * 只用来判断「公告内容是否还是被关掉的那一条」，与安全无关，
 * 要的是短、稳定、同样输入同样输出。
 */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function useAnnouncement() {
  const { t } = useLang();
  const systemStore = useSystemStore();

  const content = computed(() => systemStore.announcement.content ?? "");

  // 开关关闭或正文为空时整个公告都不渲染，避免留下一个空壳
  const available = computed(
    () => systemStore.announcement.enabled && !!content.value.trim(),
  );

  // 标题留空时回落到默认文案
  const title = computed(
    () =>
      systemStore.announcement.title?.trim() ||
      t("views.main.announcement.defaultTitle"),
  );

  /*
    当前这条公告的签名

    关闭状态记的是签名而不是一个布尔值：站长改了公告，签名跟着变，之前关掉的
    记录自然失效、横幅重新出现。否则改一次公告，老访客再也看不到。

    先拼标题长度再拼内容，是为了让「标题 A + 正文 B」和「标题 AB + 空正文」
    这类边界拼不出同一个串。
  */
  const signature = computed(() => {
    const rawTitle = systemStore.announcement.title ?? "";
    return hash(`${rawTitle.length}:${rawTitle}${content.value}`);
  });

  const dismissedSignature = useStorage<string>(STORAGE_KEY, "");
  const dismissed = computed(
    () => dismissedSignature.value === signature.value,
  );

  /** 关闭当前这条公告（仅移动端横幅使用） */
  const dismiss = () => {
    dismissedSignature.value = signature.value;
  };

  return { available, title, content, dismissed, dismiss };
}
