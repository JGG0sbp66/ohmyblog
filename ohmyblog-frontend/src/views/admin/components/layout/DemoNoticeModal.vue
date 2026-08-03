<!-- src/views/admin/components/layout/DemoNoticeModal.vue -->
<!--
  演示模式提示弹窗

  演示站的游客第一次进后台时弹一次，说明这里是只读的，避免他们
  点了保存才发现改不动。站长用真实账号登录后完全不会出现。

  两个按钮的区别：
  - 确定     → 本次浏览器会话内不再弹（ESC / 点击遮罩外同此行为）
  - 不再弹出 → 这台浏览器永久不再弹
-->
<script setup lang="ts">
import { ref, watch } from "vue";
import { Eye } from "lucide-vue-next";
import { useSessionStorage, useStorage } from "@vueuse/core";
import ConfirmModal from "@/components/base/pop/ConfirmModal.vue";
import { useLang } from "@/composables/lang.hook";
import { useAuthStore } from "@/stores/auth.store";
import { useSystemStore } from "@/stores/system.store";

const { t } = useLang();
const authStore = useAuthStore();
const systemStore = useSystemStore();

const isOpen = ref(false);
/** 本次会话已关闭 */
const dismissedSession = useSessionStorage("ohmyblog:demo-notice-seen", false);
/** 永久关闭 */
const dismissedForever = useStorage("ohmyblog:demo-notice-muted", false);

// 用 watch + immediate 而不是 onMounted：demo / user 两个状态由路由守卫
// 异步填充，万一晚于本组件挂载才就绪，这里仍能正确触发
watch(
  () => systemStore.demo && authStore.isDemoUser,
  (isDemoGuest) => {
    if (!isDemoGuest) return;
    if (dismissedSession.value || dismissedForever.value) return;
    isOpen.value = true;
  },
  { immediate: true },
);

/** 关闭（含 ESC、点击遮罩外）：本次会话内不再打扰 */
const handleClose = () => {
  isOpen.value = false;
  dismissedSession.value = true;
};

/** 不再弹出：写入 localStorage，换会话也不再出现 */
const handleMute = () => {
  dismissedForever.value = true;
  handleClose();
};
</script>

<template>
  <ConfirmModal
    :model-value="isOpen"
    :icon="Eye"
    icon-class="text-accent"
    :title="t('views.admin.demoModal.title')"
    :question="t('views.admin.demoModal.description')"
    :cancel-text="t('views.admin.demoModal.confirm')"
    :confirm-text="t('views.admin.demoModal.mute')"
    @update:model-value="handleClose"
    @confirm="handleMute"
  >
    <p class="text-fg-muted text-xs">
      {{ t("views.admin.demoModal.hint") }}
    </p>
  </ConfirmModal>
</template>
