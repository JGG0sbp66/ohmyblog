<!-- src/views/admin/components/settings/AppearancePreview.vue -->
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import Loading from "@/components/icon/common/Loading.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";

const { t } = useI18n();
const { locale } = useLang();
const systemStore = useSystemStore();

// 从 store 获取站点信息
const siteTitle = computed(() => systemStore.siteInfo.title || "OhMyBlog");
const siteFavicon = computed(() => systemStore.siteInfo.favicon);

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
  <div
    class="flex-1 bg-bg-card rounded-3xl shadow-xl overflow-hidden relative group flex flex-col transition-all duration-500 self-stretch"
  >
    <!-- 浏览器模拟工具栏 -->
    <div
      class="h-10 bg-bg-card border-b border-border flex items-center px-4 gap-4 shrink-0 justify-between"
    >
      <div class="flex items-center gap-4 h-full">
        <!-- 三色点 -->
        <div class="flex gap-1.5 shrink-0">
          <div class="w-2.5 h-2.5 rounded-full bg-red-400/60"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-yellow-400/60"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-green-400/60"></div>
        </div>
        <!-- Tab 模拟 -->
        <div class="flex items-end h-full">
          <div
            class="h-8 px-4 bg-bg-muted/80 border-x border-t border-border rounded-t-lg flex items-center gap-2 min-w-35 max-w-55"
          >
            <div
              v-if="siteFavicon"
              class="w-4 h-4 rounded-sm overflow-hidden shrink-0"
            >
              <img :src="siteFavicon" class="w-full h-full object-cover" />
            </div>
            <div
              v-else
              class="w-3 h-3 rounded-full bg-accent/20 flex items-center justify-center shrink-0"
            >
              <div class="w-1.5 h-1.5 rounded-full bg-accent"></div>
            </div>
            <span
              class="text-[11px] font-bold text-fg/70 truncate select-none"
              >{{ siteTitle }}</span
            >
          </div>
        </div>
      </div>

      <!-- 右侧实时预览状态 -->
      <BaseTag type="info" size="xs">
        {{ t("views.admin.Settings.appearance.preview") }}
      </BaseTag>
    </div>

    <!-- 主要内容区域 -->
    <div
      class="flex-1 relative flex items-center justify-center min-h-0 bg-bg-muted/30"
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
        class="h-full transition-all duration-500 ease-in-out origin-center relative"
        :class="
          viewportMode === 'pc'
            ? 'w-full'
            : 'w-95 border-x-8 border-bg-muted rounded-4xl shadow-2xl my-4 h-[90%] overflow-hidden'
        "
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
