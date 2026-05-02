import { ref } from "vue";
import { defineStore } from "pinia";
import { getEmailUnreadCount, markAllEmailsAsRead } from "@/api/email.api";

export const useEmailStore = defineStore("email", () => {
  const unreadCount = ref(0);

  async function fetchUnreadCount() {
    try {
      unreadCount.value = (await getEmailUnreadCount()) ?? 0;
    } catch {
      unreadCount.value = 0;
    }
  }

  function decreaseUnread(by = 1) {
    unreadCount.value = Math.max(0, unreadCount.value - by);
  }

  async function markAllAsRead() {
    await markAllEmailsAsRead();
    unreadCount.value = 0;
  }

  return {
    unreadCount,
    fetchUnreadCount,
    decreaseUnread,
    markAllAsRead,
  };
});
