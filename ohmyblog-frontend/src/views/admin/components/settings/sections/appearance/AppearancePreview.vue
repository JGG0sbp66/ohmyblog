<!-- src/views/admin/components/settings/AppearancePreview.vue -->
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import Loading from "@/components/common/item/Loading.vue";
import BrowserMockup from "@/components/common/container/BrowserMockup.vue";

const { t } = useI18n();
const { locale } = useLang();
const systemStore = useSystemStore();

// 从 store 获取站点信息
// 预览地址，默认为首页
const previewUrl = ref(window.location.origin + "/");
const isLoading = ref(true);

// 视口宽度：pc (100%) 或 mobile (400px)
defineProps<{
  viewportMode: "pc" | "mobile";
}>();

const handleLoad = () => {
  isLoading.value = false;
};

// 监听语言变化，刷新 iframe
watch(locale, () => {
  isLoading.value = true;
  // 通过重新赋值 src 触发 iframe 刷新
  const currentUrl = previewUrl.value;
  previewUrl.value = "";
  // 稍微延迟一下确保 DOM 更新
  setTimeout(() => {
    previewUrl.value = currentUrl;
  }, 50);
});
</script>

<template>
  <BrowserMockup
    :title="systemStore.siteInfo.title"
    :icon="systemStore.siteInfo.favicon"
    :viewport-mode="viewportMode"
  >
    <!-- 加载遮罩 -->
    <div
      v-if="isLoading"
      class="absolute inset-0 z-10 bg-bg-card flex flex-col items-center justify-center text-fg-dim"
    >
      <Loading size-class="w-10 h-10" color-class="text-accent" />
    </div>

    <!-- 预览 Iframe -->
    <iframe
      v-if="previewUrl"
      :src="previewUrl"
      class="w-full h-full border-none transition-opacity duration-500 bg-white"
      :class="{ 'opacity-0': isLoading, 'opacity-100': !isLoading }"
      @load="handleLoad"
    ></iframe>
  </BrowserMockup>
</template>

<style scoped>
/* 针对预览窗口的缩放优化 */
iframe {
  background: transparent;
  /* 确保预览页面的滚动条不会影响布局 */
  scrollbar-width: none;
}
iframe::-webkit-scrollbar {
  display: none;
}
</style>
