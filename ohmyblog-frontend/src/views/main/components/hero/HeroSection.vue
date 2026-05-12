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
  <!-- 只在有 hero 图时才渲染整个 section -->
  <section
    v-if="systemStore.personalInfo.hero"
    id="hero"
    :class="[
      'relative w-full overflow-hidden onload-animation transition-[height] duration-700 ease-in-out',
      isHome ? 'h-[65vh]' : 'h-[40vh]',
    ]"
  >
    <!-- 使用专用的 Hero 过渡组件 -->
    <HeroImageTransition
      :src="systemStore.personalInfo.hero"
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
