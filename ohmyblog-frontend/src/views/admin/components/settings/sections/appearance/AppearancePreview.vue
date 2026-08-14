<!-- src/views/admin/components/settings/AppearancePreview.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import { useLang } from "@/composables/lang.hook";
import BrowserMockup from "@/components/common/container/BrowserMockup.vue";

const { locale } = useLang();

// 预览地址，默认为首页
const previewUrl = ref(window.location.origin + "/");

// 视口宽度：pc (100%) 或 mobile (9:19.5 手机比例，宽度随高度推算)
defineProps<{
  viewportMode: "pc" | "mobile";
}>();

// 监听语言变化，刷新 iframe（通过切换 src 触发重加载）
watch(locale, () => {
  const currentUrl = previewUrl.value;
  previewUrl.value = "";
  setTimeout(() => {
    previewUrl.value = currentUrl;
  }, 50);
});
</script>

<template>
  <BrowserMockup :src="previewUrl" :viewport-mode="viewportMode" />
</template>
