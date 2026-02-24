import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { getMe } from "@/api/auth.api";

type TCurrentUser = Awaited<ReturnType<typeof getMe>>;

export const useAuthStore = defineStore("auth", () => {
  // 当前登录用户；未登录时为 null
  const user = ref<TCurrentUser | null>(null);
  // 是否管理员
  const isAdmin = computed(() => user.value?.role === "admin");

  // 调用 /auth/me 同步当前会话；失败时回退为未登录
  async function fetchMe() {
    try {
      const profile = await getMe();
      user.value = profile;
      return profile;
    } catch {
      user.value = null;
      return null;
    }
  }

  return {
    user,
    isAdmin,
    fetchMe,
  };
});
