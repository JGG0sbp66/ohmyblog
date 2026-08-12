<!-- src/views/main/components/HeroSection.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useSystemStore } from "@/stores/system.store";
import { useAuthStore } from "@/stores/auth.store";
import HeroImageEditor from "./editors/HeroImageEditor.vue";
import HeroTitleEditor from "./editors/HeroTitleEditor.vue";
import HeroImageTransition from "./display/HeroImageTransition.vue";
import HeroTitleDisplay from "./display/HeroTitleDisplay.vue";

const route = useRoute();
const systemStore = useSystemStore();
const authStore = useAuthStore();

const isHome = computed(() => route.name === "home");

/**
 * 是否渲染整个 Hero 区块。
 *
 * 两个条件：有图，且开关没被关掉。
 * 显式判 !== false 而不是直接取真值：这个开关是后加的，存量 personal_info 配置里
 * 没有 heroEnabled 字段，undefined 必须当「开启」处理，否则老站点升级后横幅会凭空消失。
 */
const heroVisible = computed(
  () =>
    !!systemStore.personalInfo.hero &&
    systemStore.personalInfo.heroEnabled !== false,
);

/**
 * 横幅地址。
 *
 * 单独抽一个 computed 是为了给 HeroImageTransition 一个确定的 string：
 * 原先模板上 v-if 直接判 hero，TS 能顺着收窄类型；改判 heroVisible 之后收窄链断了。
 * 这里的 ?? "" 只是兜底，section 本身在 hero 为空时不会渲染。
 */
const heroSrc = computed(() => systemStore.personalInfo.hero ?? "");

// Banner 动画控制 (声明式)
const isBannerVisible = ref(false);

onMounted(() => {
  // 页面加载后触发
  setTimeout(() => {
    isBannerVisible.value = true;
  }, 100);
});
</script>

<template>
  <!-- 有图且开关开启时才渲染整个 section -->
  <section
    v-if="heroVisible"
    id="hero"
    :class="[
      'relative w-full overflow-hidden onload-animation transition-[height] duration-700 ease-in-out -mb-28',
      isHome ? 'h-[65vh]' : 'h-[40vh]',
    ]"
  >
    <!-- 使用专用的 Hero 过渡组件 -->
    <HeroImageTransition
      :src="heroSrc"
      :show="isBannerVisible"
      alt="Hero banner image"
      :duration="1000"
      class="w-full h-full"
    />

    <!-- 标题显示层 -->
    <HeroTitleDisplay />

    <div
      v-if="authStore.isAdmin"
      class="absolute bottom-6 right-6 z-20 flex items-center gap-3"
    >
      <!-- Hero 图片编辑按钮 -->
      <HeroImageEditor />
      <!-- Hero 标题编辑按钮 -->
      <HeroTitleEditor />
    </div>
  </section>
</template>

<style scoped></style>
