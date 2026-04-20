<!-- src/views/admin/components/layout/AdminHeader.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useLang } from "@/composables/lang.hook";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import HomeIcon from "@/components/icon/ui/Home.vue";
import NotificationButton from "@/components/common/button/NotificationButton.vue";

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
  <header>
    <div
      class="w-full md:max-w-300 md:w-[95%] mx-auto h-18 flex items-center justify-between bg-bg-card rounded-b-2xl shadow-sm px-6"
    >
      <!-- 左侧页面名称 -->
      <div class="flex items-center ml-4">
        <h1 class="text-xl font-semibold text-fg">{{ currentPageName }}</h1>
      </div>

      <!-- 右侧按钮组 -->
      <div class="flex items-center gap-2 mr-4">
        <!-- 返回首页按钮 -->
        <div class="w-11 h-11">
          <ButtonSecondary
            @click="goToHome"
            :title="t('components.common.admin.AdminHeader.actions.goHome')"
            class="w-full h-full"
          >
            <HomeIcon />
          </ButtonSecondary>
        </div>

        <!-- 消息通知按钮 -->
        <NotificationButton />
      </div>
    </div>
  </header>
</template>
