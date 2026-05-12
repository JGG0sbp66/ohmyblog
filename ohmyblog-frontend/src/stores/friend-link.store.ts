// src/stores/friend-link.store.ts
import { ref } from "vue";
import { defineStore } from "pinia";
import { getFriendLinkPendingCount } from "@/api/friend-link.api";

export const useFriendLinkStore = defineStore("friendLink", () => {
  /** 全局待审批友链数，侧边栏 badge 和仪表盘卡片共享此值 */
  const pendingCount = ref(0);

  /** 从服务端拉取最新待审批数并写入 store */
  async function fetchPendingCount() {
    try {
      const data = await getFriendLinkPendingCount();
      pendingCount.value = (data as any) ?? 0;
    } catch {
      pendingCount.value = 0;
    }
  }

  /** 本地乐观递减待审批数，避免操作后再发一次请求 */
  function decreasePending(by = 1) {
    pendingCount.value = Math.max(0, pendingCount.value - by);
  }

  return {
    pendingCount,
    fetchPendingCount,
    decreasePending,
  };
});
