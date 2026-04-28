<!-- src/views/admin/components/settings/site/SitePreview.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useSystemStore } from "@/stores/system.store";
import BrowserMockup from "@/components/common/container/BrowserMockup.vue";
import HeroSection from "@/views/main/components/hero/HeroSection.vue";
import Footer from "@/components/common/layout/Footer.vue";

const systemStore = useSystemStore();

// 模拟标签页标题和图标
</script>

<template>
  <BrowserMockup :title="systemStore.siteInfo.title" :icon="systemStore.siteInfo.favicon">
    <div
      class="w-full h-full overflow-y-auto overflow-x-hidden bg-bg custom-scrollbar flex flex-col"
    >
      <HeroSection class="flex-1 h-auto! shrink-0" />
      <Footer class="shrink-0" />
    </div>
  </BrowserMockup>
</template>

<style scoped>
/* 隐藏滚动条但保留滚动能力，防止动画引起的布局抖动 */
.custom-scrollbar::-webkit-scrollbar {
  display: none;
}
.custom-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
