<!-- src/components/common/layout/Header.vue -->
<!--
TODO: Header 组件优化清单
1. [响应式/后期再考虑，需要实现] 移动端适配优化
   - 小屏幕(<768px)时隐藏导航栏,显示汉堡菜单
   - 实现移动端侧边栏导航
-->
<script lang="ts" setup>
import ToggleLanguage from "@/components/theme/ToggleLanguage.vue";
import ToggleTheme from "@/components/theme/ToggleTheme.vue";
import ToggleColor from "@/components/theme/ToggleColor.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import HeaderSearch from "@/components/base/search/HeaderSearch.vue";
import SettingsButton from "@/components/common/button/SettingsButton.vue";
import { useLang } from "@/composables/lang.hook";
import { useRouter, useRoute } from "vue-router";
import { computed } from "vue";
import { useWindowScroll } from "@vueuse/core";

const { t } = useLang();
const router = useRouter();
const route = useRoute();

const navItems = computed(() => [
  { name: "home", label: t("components.common.layout.Header.nav.home") },
  { name: "archive", label: t("components.common.layout.Header.nav.archive") },
  { name: "about", label: t("components.common.layout.Header.nav.about") },
]);

const handleNavClick = (routeName: string) => {
  router.push({ name: routeName });
};

const { y } = useWindowScroll();
const isHidden = computed(() => y.value > 100);
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
      <!-- 左侧搜索区域 -->
      <div class="ml-4">
        <HeaderSearch />
      </div>

      <!-- 中间导航栏区域 -->
      <nav class="flex items-center gap-2 stagger-container">
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

      <!-- 右侧按钮区域 -->
      <div class="flex items-center mr-4 gap-2 stagger-container">
        <ToggleColor class="onload-animation" />
        <ToggleTheme class="onload-animation" />
        <ToggleLanguage class="onload-animation" />
        <SettingsButton class="onload-animation" />
      </div>
    </div>
  </header>
</template>
