<!-- src/views/admin/components/user/AdminUserInfo.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useLang } from "@/composables/lang.hook";
import { useAuthStore } from "@/stores/auth.store";
import UserIcon from "@/components/icon/common/User.vue";

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
      <div
        v-show="isExpanded"
        :class="[contentClass, 'flex flex-col items-start']"
      >
        <span class="text-sm font-medium whitespace-nowrap">
          {{ authStore.user?.username }}
        </span>
        <span class="text-xs text-fg-muted whitespace-nowrap">
          {{ t("components.common.admin.AdminSidebar.user.logout") }}
        </span>
      </div>
    </button>
  </div>
</template>
