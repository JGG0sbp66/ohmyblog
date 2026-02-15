<script lang="ts" setup>
import ToggleLanguage from "@/components/theme/ToggleLanguage.vue";
import ToggleTheme from "@/components/theme/ToggleTheme.vue";
import ToggleColor from "@/components/theme/ToggleColor.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import HeaderSearch from "@/components/base/search/HeaderSearch.vue";
import { useLang } from "@/composables/lang.hook";
import { computed } from "vue";

const { t } = useLang();

const navItems = computed(() => [
  { name: "home", label: t("components.common.layout.Header.nav.home") },
  { name: "archive", label: t("components.common.layout.Header.nav.archive") },
  { name: "about", label: t("components.common.layout.Header.nav.about") },
]);

const headerClass = `
/* 1. 核心尺寸与居中 */
w-full md:max-w-[1200px] md:w-[95%] mx-auto h-18

/* 2. 内部布局 */
flex items-center justify-between

/* 3. 背景与边框 */
bg-bg-card rounded-b-2xl shadow-sm
`;
</script>
<template>
  <header>
    <div :class="headerClass">
      <!-- 左侧搜索区域 -->
      <div class="ml-4">
        <HeaderSearch />
      </div>

      <!-- 中间导航栏区域 -->
      <nav class="flex items-center gap-2">
        <div class="h-11" v-for="item in navItems" :key="item.name">
          <ButtonSecondary :text="item.label" class="px-4" block>
          </ButtonSecondary>
        </div>
      </nav>

      <!-- 右侧按钮区域 -->
      <div class="flex items-center mr-4 gap-2">
        <ToggleColor />
        <ToggleTheme />
        <ToggleLanguage />
      </div>
    </div>
  </header>
</template>
