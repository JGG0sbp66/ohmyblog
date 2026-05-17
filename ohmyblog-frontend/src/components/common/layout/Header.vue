<!-- src/components/common/layout/Header.vue -->
<script lang="ts" setup>
import ToggleLanguage from "@/components/theme/ToggleLanguage.vue";
import ToggleTheme from "@/components/theme/ToggleTheme.vue";
import ToggleColor from "@/components/theme/ToggleColor.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import HeaderSearch from "@/components/base/search/HeaderSearch.vue";
import SettingsButton from "@/components/common/button/SettingsButton.vue";
import MobileNavDrawer from "@/components/common/layout/MobileNavDrawer.vue";
import { Menu } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import { useRouter, useRoute } from "vue-router";
import { computed, ref, watch } from "vue";
import { useWindowScroll } from "@vueuse/core";

const { t } = useLang();
const router = useRouter();
const route = useRoute();

const navItems = computed(() => [
  { name: "home", label: t("components.common.layout.Header.nav.home") },
  { name: "archive", label: t("components.common.layout.Header.nav.archive") },
  { name: "friends", label: t("components.common.layout.Header.nav.friends") },
]);

const handleNavClick = (routeName: string) => {
  router.push({ name: routeName });
};

const { y } = useWindowScroll();
const isHidden = computed(() => y.value > 100);

// 移动端抽屉开关；路由切换后自动关闭，避免返回时残留打开状态。
const isDrawerOpen = ref(false);
watch(
  () => route.fullPath,
  () => {
    isDrawerOpen.value = false;
  },
);
</script>
<template>
  <header
    id="navbar"
    aria-label="主导航"
    class="fixed top-0 left-0 right-0 z-50 onload-animation transition-transform duration-300"
    :class="{ '-translate-y-full': isHidden }"
  >
    <!-- 核心尺寸与居中 | 内部布局 | 背景与边框 -->
    <div
      class="w-full md:max-w-300 md:w-[95%] mx-auto h-18 flex items-center justify-between bg-bg-card rounded-b-2xl shadow-sm"
    >
      <!-- 左侧：搜索（桌面 / 移动端共用） -->
      <div class="ml-3 md:ml-4">
        <HeaderSearch />
      </div>

      <!-- 中间导航栏区域（仅桌面） -->
      <nav class="hidden md:flex items-center gap-2 stagger-container">
        <ButtonSecondary
          v-for="item in navItems"
          :key="item.name"
          :text="item.label"
          :isActive="route.name === item.name"
          :aria-current="route.name === item.name ? 'page' : undefined"
          class="h-11 px-4 onload-animation"
          @click="handleNavClick(item.name)"
        >
        </ButtonSecondary>
      </nav>

      <!-- 右侧按钮区域（桌面 / 移动端共用，仅移动端额外多一个汉堡按钮） -->
      <div
        class="flex items-center mr-3 md:mr-4 gap-1 md:gap-2 stagger-container"
      >
        <ToggleColor class="onload-animation" />
        <ToggleTheme class="onload-animation" />
        <ToggleLanguage class="onload-animation" />
        <SettingsButton class="onload-animation" />

        <!-- 移动端汉堡按钮：用于打开导航抽屉 -->
        <div class="w-11 h-11 md:hidden onload-animation">
          <ButtonSecondary
            class="w-full h-full"
            :aria-label="t('components.common.layout.Header.menu.open')"
            :aria-expanded="isDrawerOpen"
            @click="isDrawerOpen = true"
          >
            <Menu class="w-5 h-5" />
          </ButtonSecondary>
        </div>
      </div>
    </div>

    <!-- 移动端导航抽屉 -->
    <MobileNavDrawer v-model="isDrawerOpen" :nav-items="navItems" />
  </header>
</template>
