<!-- src/views/admin/components/layout/AdminHeader.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Menu } from "lucide-vue-next";
import { RiHome5Line } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import NotificationButton from "@/components/common/button/NotificationButton.vue";

const emit = defineEmits<{
  (e: "open-menu"): void;
}>();

const router = useRouter();
const route = useRoute();
const { t } = useLang();

// 当前页面名称
const currentPageName = computed(() => {
  const routeName = route.name as string;
  return t(`components.common.admin.AdminHeader.pages.${routeName}`, {
    default: t("components.common.admin.AdminHeader.pages.default"),
  });
});

// 返回首页
const goToHome = () => {
  router.push({ name: "home" });
};
</script>

<template>
  <header class="relative z-10">
    <div
      class="mx-auto flex w-full flex-wrap items-center rounded-b-2xl bg-bg-card px-3 shadow-sm md:w-[95%] md:max-w-300 md:flex-nowrap md:px-6"
    >
      <!-- 第一行左侧：页面名称 -->
      <div
        class="order-1 flex h-18 min-w-0 flex-1 items-center onload-animation md:ml-4 md:flex-none"
      >
        <h1 class="min-w-0 truncate text-base font-semibold text-fg md:text-xl">
          {{ currentPageName }}
        </h1>
      </div>

      <!-- 桌面端位于中间；移动端有内容时成为可横向滚动的第二行。 -->
      <div
        id="admin-header-center"
        class="order-3 flex min-w-0 basis-full items-center justify-start gap-2 overflow-x-auto border-t border-fg-muted/10 px-1 py-2 custom-scrollbar [&>*]:shrink-0 md:order-2 md:mx-4 md:flex-1 md:basis-auto md:justify-center md:overflow-visible md:border-0 md:px-0 md:py-0"
      ></div>

      <!-- 第一行右侧按钮组 -->
      <div
        class="order-2 flex h-18 shrink-0 items-center gap-2 stagger-container md:order-3 md:mr-4"
      >
        <!-- 返回首页按钮 -->
        <div class="h-11 w-11 onload-animation">
          <ButtonSecondary
            @click="goToHome"
            :title="t('components.common.admin.AdminHeader.actions.goHome')"
            class="h-full w-full"
          >
            <RiHome5Line class="h-5 w-5" />
          </ButtonSecondary>
        </div>

        <!-- 消息通知按钮 -->
        <NotificationButton class="onload-animation" />

        <!-- 移动端菜单入口：置于最右，与前台 Header 保持一致 -->
        <div class="h-11 w-11 shrink-0 onload-animation md:hidden">
          <ButtonSecondary
            class="h-full w-full"
            :title="t('components.common.layout.Header.menu.title')"
            :aria-label="t('components.common.layout.Header.menu.title')"
            @click="emit('open-menu')"
          >
            <Menu class="h-5 w-5" />
          </ButtonSecondary>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* 普通后台页面没有二级导航时，不保留空白的移动端第二行。 */
@media (max-width: 47.999rem) {
  #admin-header-center:empty {
    display: none;
  }
}
</style>
