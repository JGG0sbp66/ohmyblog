<!-- src/views/admin/components/settings/site/SitePreview.vue -->
<script setup lang="ts">
import BrowserMockup from "@/components/common/container/BrowserMockup.vue";
import HeroSection from "@/views/main/components/hero/HeroSection.vue";
import Footer from "@/components/common/layout/Footer.vue";
</script>

<template>
  <BrowserMockup>
    <div
      class="w-full h-full overflow-y-auto overflow-x-hidden bg-bg custom-scrollbar flex flex-col"
    >
      <HeroSection class="flex-1 h-auto! shrink-0" />
      <Footer class="shrink-0" />
    </div>
  </BrowserMockup>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  display: none;
}
.custom-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
