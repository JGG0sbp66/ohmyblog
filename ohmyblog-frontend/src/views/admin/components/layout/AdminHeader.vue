<!-- src/views/admin/components/layout/AdminHeader.vue -->
<!--
  ============================================================================
  TODO[移动端适配 · 顶部栏]：Header 在手机上需要做两件事——加汉堡按钮、收缩间距：

  1. 新增「汉堡菜单按钮」用于唤出侧边栏抽屉：
     - 仅移动端显示（md:hidden），放在左侧页面名称之前；
     - 点击时 emit('toggleMenu') 通知 AdminLayout 切换 isMobileMenuOpen；
     - 图标可用 lucide-vue-next 的 Menu。
  2. 响应式间距/尺寸（当前都是固定值，小屏偏挤、易溢出）：
     - 外层 px-6 -> px-3 md:px-6；左右两侧 ml-4 / mr-4 在小屏可减小或去掉；
     - 中间二级导航插槽 #admin-header-center 在窄屏可能放不下，考虑 max-md:hidden
       或挪到第二行；
     - 标题 text-xl -> text-base md:text-xl，必要时 truncate 防止换行。
  3. 右侧按钮组（返回首页 + 通知）在移动端保留即可，注意与汉堡按钮的间距平衡。
  ============================================================================
-->
<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useLang } from "@/composables/lang.hook";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { RiHome5Line } from "@remixicon/vue";
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
  <header class="relative z-10">
    <div
      class="w-full md:max-w-300 md:w-[95%] mx-auto h-18 flex items-center justify-between bg-bg-card rounded-b-2xl shadow-sm px-6"
    >
      <!-- 左侧页面名称 -->
      <div class="flex items-center ml-4 onload-animation">
        <h1 class="text-xl font-semibold text-fg">{{ currentPageName }}</h1>
      </div>

      <!-- 中间二级导航插槽 -->
      <div
        id="admin-header-center"
        class="flex-1 flex justify-center mx-4"
      ></div>

      <!-- 右侧按钮组 -->
      <div class="flex items-center gap-2 mr-4 stagger-container">
        <!-- 返回首页按钮 -->
        <div class="w-11 h-11 onload-animation">
          <ButtonSecondary
            @click="goToHome"
            :title="t('components.common.admin.AdminHeader.actions.goHome')"
            class="w-full h-full"
          >
            <RiHome5Line class="w-5 h-5" />
          </ButtonSecondary>
        </div>

        <!-- 消息通知按钮 -->
        <NotificationButton class="onload-animation" />
      </div>
    </div>
  </header>
</template>
