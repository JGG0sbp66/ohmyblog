// src/stores/email.store.ts
import { ref } from "vue";
import { defineStore } from "pinia";
import { getEmailUnreadCount, markAllEmailsAsRead } from "@/api/email.api";
import type { EmailLogItem } from "@/views/admin/components/emails/types";

export const useEmailStore = defineStore("email", () => {
  /** 全局未读邮件数，侧边栏 badge 和仪表盘卡片共享此值 */
  const unreadCount = ref(0);

  /** 从通知面板跳转到邮件页时，暂存待打开的邮件项；消费后置 null */
  const pendingOpenItem = ref<EmailLogItem | null>(null);

  /** 从服务端拉取最新未读数并写入 store */
  async function fetchUnreadCount() {
    try {
      unreadCount.value = (await getEmailUnreadCount()) ?? 0;
    } catch {
      unreadCount.value = 0;
    }
  }

  /** 本地乐观递减未读数，避免操作后再发一次请求 */
  function decreaseUnread(by = 1) {
    unreadCount.value = Math.max(0, unreadCount.value - by);
  }

  /** 全部标为已读：调用 API 后将本地计数清零 */
  async function markAllAsRead() {
    await markAllEmailsAsRead();
    unreadCount.value = 0;
  }

  return {
    unreadCount,
    pendingOpenItem,
    fetchUnreadCount,
    decreaseUnread,
    markAllAsRead,
  };
});
