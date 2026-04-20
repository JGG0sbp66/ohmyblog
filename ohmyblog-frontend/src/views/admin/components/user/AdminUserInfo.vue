<!-- src/views/admin/components/user/AdminUserInfo.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useLang } from "@/composables/lang.hook";
import { useAuthStore } from "@/stores/auth.store";
import UserIcon from "@/components/icon/common/User.vue";
import BaseModal from "@/components/base/pop/BaseModal.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { TriangleAlert, Info } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    isExpanded?: boolean;
  }>(),
  {
    isExpanded: false,
  },
);

const { t } = useLang();
const authStore = useAuthStore();
const router = useRouter();

// 弹窗状态
const isModalOpen = ref(false);
// 退出登录加载状态
const isLoggingOut = ref(false);

// 处理退出登录
async function handleLogout() {
  isLoggingOut.value = true;
  try {
    const success = await authStore.logout();
    if (success) {
      isModalOpen.value = false;
      // 跳转到登录页
      router.push({ name: "login" });
    }
  } finally {
    isLoggingOut.value = false;
  }
}

// 静态基础样式 - 参考 SidebarButton
const baseClass = `
  h-12 flex items-center
  rounded-xl
  transition-all duration-300
  overflow-hidden
  relative
  cursor-pointer
  before:content-['']
  before:absolute before:top-0 before:left-0
  before:w-full before:h-full
  before:rounded-xl
  before:bg-bg-muted
`;

// 动态样式 - 根据 props 计算
const dynamicClass = computed(() => {
  const classes = [];

  // 展开/收起状态的宽度
  if (props.isExpanded) {
    classes.push("w-full px-4");
  } else {
    classes.push("w-12 px-0");
  }

  // 默认态：背景层隐藏，hover 时显示
  classes.push(
    "before:opacity-0 before:scale-90",
    "text-fg",
    "hover:before:opacity-100 hover:before:scale-100",
    "hover:text-accent",
  );

  // 点击反馈
  classes.push("active:scale-95 active:opacity-80");

  return classes.join(" ");
});

// 内容容器样式
const contentClass = "relative z-10 pointer-events-none";

// 头像容器 - 固定宽度，始终居中
const avatarContainerClass = "w-12 flex items-center justify-center shrink-0";
</script>

<template>
  <div class="w-full px-3 mt-auto">
    <div class="w-full border-t border-fg-muted/15 mb-3"></div>
    <button
      type="button"
      :class="[baseClass, dynamicClass]"
      :title="authStore.user?.username"
      @click="isModalOpen = true"
    >
      <!-- 头像容器 - 固定宽度保证头像位置不变 -->
      <div :class="avatarContainerClass">
        <div
          :class="[
            contentClass,
            'w-8 h-8 rounded-full bg-bg-muted flex items-center justify-center overflow-hidden',
          ]"
        >
          <img
            v-if="authStore.user?.avatar"
            :src="authStore.user.avatar"
            :alt="authStore.user?.username"
            class="w-full h-full object-cover"
          />
          <UserIcon v-else sizeClass="w-4 h-4 text-fg-muted" />
        </div>
      </div>

      <!-- 用户信息 - 只在展开时显示 -->
      <Transition name="fade">
        <div
          v-if="isExpanded"
          :class="[contentClass, 'flex flex-col items-start']"
        >
          <span class="text-sm font-medium whitespace-nowrap">
            {{ authStore.user?.username }}
          </span>
          <span class="text-xs text-fg-muted whitespace-nowrap">
            {{ t("components.common.admin.AdminSidebar.user.logout") }}
          </span>
        </div>
      </Transition>
    </button>

    <!-- 用户信息弹窗 -->
    <BaseModal v-model="isModalOpen" maxWidth="max-w-lg">
      <template #header>
        <div class="flex items-center gap-2">
          <TriangleAlert class="w-5 h-5 text-red-500" />
          <h2 class="text-xl font-bold text-fg">
            {{ t("components.common.admin.AdminSidebar.user.modal.title") }}
          </h2>
        </div>
      </template>

      <div class="space-y-3">
        <p class="text-fg text-sm">
          {{ t("components.common.admin.AdminSidebar.user.modal.question") }}
        </p>
        <div class="flex items-center gap-1 text-red-500">
          <Info class="w-3.5 h-3.5 shrink-0" />
          <p class="text-xs">
            {{ t("components.common.admin.AdminSidebar.user.modal.warning") }}
          </p>
        </div>
      </div>

      <template #footer>
        <ButtonSecondary
          :text="t('components.common.admin.AdminSidebar.user.modal.cancel')"
          @click="isModalOpen = false"
          class="min-w-24 py-2"
        />
        <ButtonPrimary
          :text="t('components.common.admin.AdminSidebar.user.modal.confirm')"
          :loading="isLoggingOut"
          @click="handleLogout"
          class="min-w-24 py-2"
        />
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.fade-enter-active {
  transition: opacity 200ms;
}

.fade-leave-active {
  transition: opacity 150ms;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
