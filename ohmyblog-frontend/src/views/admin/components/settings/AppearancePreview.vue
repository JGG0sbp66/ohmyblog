<!-- src/views/admin/components/settings/AppearancePreview.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useLang } from "@/composables/lang.hook";
import Loading from "@/components/icon/common/Loading.vue";

const { t } = useI18n();
const { locale } = useLang();

// 预览地址，默认为首页
const previewUrl = ref(window.location.origin + "/");
const isLoading = ref(true);

// 视口宽度：pc (100%) 或 mobile (400px)
defineProps<{
  viewportMode: 'pc' | 'mobile';
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
  <div
    class="flex-1 bg-bg-card rounded-3xl shadow-xl overflow-hidden relative group flex flex-col items-center justify-center transition-all duration-500 self-stretch"
  >
    <!-- 加载遮罩 -->
    <div
      v-if="isLoading"
      class="absolute inset-0 z-10 bg-bg-card flex flex-col items-center justify-center text-fg-dim"
    >
      <Loading size-class="w-10 h-10" color-class="text-accent" />
    </div>

    <!-- 预览容器：用于控制 iframe 的宽度 -->
    <div 
      class="h-full transition-all duration-500 ease-in-out origin-center"
      :class="viewportMode === 'pc' ? 'w-full' : 'w-100 border-x-12 border-y-24 border-bg-muted rounded-[40px] shadow-2xl my-4'"
    >
      <!-- 预览 Iframe -->
      <iframe
        v-if="previewUrl"
        :src="previewUrl"
        class="w-full h-full border-none transition-opacity duration-500 bg-white"
        :class="{ 'opacity-0': isLoading, 'opacity-100': !isLoading }"
        @load="handleLoad"
      ></iframe>
    </div>

    <!-- 覆盖层：防止 iframe 拦截鼠标事件 -->
    <div
      class="absolute inset-0 pointer-events-none border-4 border-transparent group-hover:border-accent/10 transition-colors rounded-3xl"
    >
      <div
        class="absolute bottom-4 left-4 bg-bg/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-fg-subtle border border-border opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {{ t('views.admin.Settings.appearance.preview') }}
      </div>
    </div>
  </div>
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
