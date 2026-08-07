<!-- src/components/common/BrowserMockup.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useResizeObserver } from "@vueuse/core";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

/**
 * 浏览器外壳模拟组件
 * 用于各种预览场景，提供统一的 UI 装饰（如三色点、标签页等）
 */
interface Props {
  /** 标签页标题 */
  title?: string;
  /** 标签页图标 URL */
  icon?: string | null;
  /** 视口模式：pc (全宽) 或 mobile (窄屏带边框) */
  viewportMode?: "pc" | "mobile";
}

const props = withDefaults(defineProps<Props>(), {
  title: "ohmyblog",
  icon: null,
  viewportMode: "pc",
});

/*
  视口尺寸

  两种模式的宽高都算成 px 后写在行内，是为了让 transition 真能插值：
  mobile 若只写 aspect-ratio、宽度交给浏览器推算，计算值是 auto，
  而 auto 与 100% 之间无法补间，切换就会变成硬跳。
*/
const MOBILE_RATIO = 9 / 19.5; // 真实手机比例
const MOBILE_HEIGHT_SCALE = 0.9; // 上下各留一点余量

const stageRef = ref<HTMLElement | null>(null);
const stageWidth = ref(0);
const stageHeight = ref(0);

useResizeObserver(stageRef, ([entry]) => {
  if (!entry) return;
  stageWidth.value = entry.contentRect.width;
  stageHeight.value = entry.contentRect.height;
});

const viewportStyle = computed(() => {
  if (props.viewportMode === "pc") {
    return { width: `${stageWidth.value}px`, height: `${stageHeight.value}px` };
  }
  const height = stageHeight.value * MOBILE_HEIGHT_SCALE;
  return {
    width: `${Math.min(height * MOBILE_RATIO, stageWidth.value)}px`,
    height: `${height}px`,
  };
});
</script>

<template>
  <div
    class="flex-1 bg-bg-card rounded-3xl shadow-lg overflow-hidden relative group flex flex-col transition-all duration-500 self-stretch border border-border/50"
  >
    <!-- 1. 浏览器模拟工具栏 -->
    <div
      class="h-10 bg-bg-card border-b border-border flex items-center px-4 gap-4 shrink-0 justify-between select-none"
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
              v-if="icon"
              class="w-4 h-4 rounded-sm overflow-hidden shrink-0"
            >
              <img :src="icon" class="w-full h-full object-cover" />
            </div>
            <div
              v-else
              class="w-3 h-3 rounded-full bg-accent/20 flex items-center justify-center shrink-0"
            >
              <div class="w-1.5 h-1.5 rounded-full bg-accent"></div>
            </div>
            <span class="text-[11px] font-bold text-fg/70 truncate">{{
              title
            }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧状态标签 -->
      <BaseTag type="primary" class="font-bold uppercase tracking-wider">
        {{ t("components.common.BrowserMockup.preview") }}
      </BaseTag>
    </div>

    <!-- 2. 主要内容区域 -->
    <div
      ref="stageRef"
      class="flex-1 relative flex items-center justify-center min-h-0 bg-bg-muted/30"
    >
      <!-- 视口容器：宽高由 viewportStyle 给出 px（见 script 中的说明），这里只管装饰与过渡 -->
      <div
        class="transition-all duration-500 ease-in-out origin-center relative overflow-hidden shrink-0"
        :class="
          viewportMode === 'pc'
            ? ''
            : 'border-x-8 border-bg-muted rounded-4xl shadow-2xl'
        "
        :style="viewportStyle"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 隐藏滚动条但保留滚动能力 */
.overflow-hidden {
  scrollbar-width: none;
}
.overflow-hidden::-webkit-scrollbar {
  display: none;
}
</style>
