import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { getMe, logout as logoutApi } from "@/api/auth.api";
import type { TUserRole } from "@/api/shared";

type TCurrentUser = Awaited<ReturnType<typeof getMe>>;

export const useAuthStore = defineStore("auth", () => {
  // 当前登录用户；未登录时为 null
  const user = ref<TCurrentUser | null>(null);
  // 是否管理员
  const isAdmin = computed(() => user.value?.role === ("admin" as TUserRole));
  // 是否演示模式下的虚拟游客身份（role 同样是 admin，但所有写操作会被后端拒绝）
  const isDemoUser = computed(() => user.value?.isDemo === true);

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

  // 退出登录
  async function logout() {
    try {
      await logoutApi();
      user.value = null;
      return true;
    } catch {
      return false;
    }
  }

  return {
    user,
    isAdmin,
    isDemoUser,
    fetchMe,
    logout,
  };
});
