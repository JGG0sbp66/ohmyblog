<!-- src/components/common/container/BrowserMockup.vue -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useResizeObserver } from "@vueuse/core";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import Loading from "@/components/common/item/Loading.vue";
import { useSystemStore } from "@/stores/system.store";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();
const systemStore = useSystemStore();

/**
 * 浏览器外壳模拟组件
 * 用于各种预览场景，提供统一的 UI 装饰（如三色点、标签页等）
 *
 * 两种内容模式：
 * 1. iframe 模式：传 src（单页）或 srcs（多 tab），组件内部管理 iframe + loading + 过渡
 * 2. slot 模式：不传 src/srcs，通过默认 slot 塞入自定义内容（Vue 组件等）
 *
 * 单 tab：传 title（+ 可选 icon）
 * 多 tab：传 tabs 数组 + v-model（activeTab 索引）
 */

export interface BrowserTab {
  /** 标签页标题 */
  title: string;
  /** 标签页图标 URL */
  icon?: string | null;
}

interface Props {
  /** 单 tab 模式：标签页标题 */
  title?: string;
  /** 单 tab 模式：标签页图标 URL */
  icon?: string | null;
  /** 多 tab 模式：标签页数组 */
  tabs?: BrowserTab[];
  /** 视口模式：pc (全宽) 或 mobile (窄屏带边框) */
  viewportMode?: "pc" | "mobile";
  /** iframe 模式（单页）：传入 URL，组件内部渲染 iframe 并管理 loading */
  src?: string;
  /** iframe 模式（多 tab）：传入 URL 数组，与 tabs 一一对应 */
  srcs?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  icon: null,
  tabs: undefined,
  viewportMode: "pc",
  src: undefined,
  srcs: undefined,
});

/** 当前激活的 tab 索引（多 tab 模式下使用） */
const activeTab = defineModel<number>({ default: 0 });

/** 是否为多 tab 模式 */
const isMultiTab = computed(() => Array.isArray(props.tabs) && props.tabs.length > 1);

/** 是否使用内置 iframe 模式 */
const isIframeMode = computed(() => Boolean(props.src || props.srcs));

/** 统一的 tab 列表：单 tab 模式自动构造一个 */
const tabList = computed<BrowserTab[]>(() => {
  if (props.tabs && props.tabs.length > 0) return props.tabs;
  return [{ title: props.title, icon: props.icon }];
});

/** 获取 tab 的图标：优先用 tab 自身的 icon，否则 fallback 到站点 favicon */
const getTabIcon = (tab: BrowserTab) =>
  tab.icon ?? systemStore.siteInfo.favicon ?? null;

/** 获取 tab 的标题：fallback 到站点标题 */
const getTabTitle = (tab: BrowserTab) =>
  tab.title || systemStore.siteInfo.title || "ohmyblog";

// ── iframe 模式：loading 管理 ───────────────────────────────────────────

/** 当前 iframe 是否加载完成 */
const iframeLoaded = ref(false);

/** 当前激活的 iframe src */
const currentSrc = computed<string | undefined>(() => {
  if (props.srcs) return props.srcs[activeTab.value];
  return props.src;
});

// 切换 tab 时重置加载状态
watch(activeTab, () => {
  iframeLoaded.value = false;
});

const handleIframeLoad = () => {
  iframeLoaded.value = true;
};

// ── 视口尺寸 ────────────────────────────────────────────────────────────

const MOBILE_RATIO = 9 / 19.5;
const MOBILE_HEIGHT_SCALE = 0.9;

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

        <!-- Tab 区域 -->
        <div class="flex items-end h-full">
          <template v-for="(tab, index) in tabList" :key="index">
            <!-- Tab 之间的分隔竖线（不在选中 tab 两侧显示） -->
            <div
              v-if="isMultiTab && index > 0 && activeTab !== index && activeTab !== index - 1"
              class="w-px h-4 bg-border/60 shrink-0 self-center"
            />

            <!-- Tab 按钮 -->
            <button
              class="h-8 px-4 flex items-center gap-2 max-w-55 cursor-pointer transition-[opacity,background-color] duration-200"
              :class="[
                activeTab === index
                  ? 'bg-bg-muted/80 border-x border-t border-border rounded-t-lg'
                  : isMultiTab
                    ? 'hover:bg-bg-muted/30 opacity-60 hover:opacity-100 rounded-lg'
                    : 'bg-bg-muted/80 border-x border-t border-border rounded-t-lg',
              ]"
              @click="activeTab = index"
            >
              <div
                v-if="getTabIcon(tab)"
                class="w-4 h-4 rounded-sm overflow-hidden shrink-0"
              >
                <img :src="getTabIcon(tab)!" class="w-full h-full object-cover" />
              </div>
              <span class="text-[11px] font-bold text-fg/70 truncate">{{
                getTabTitle(tab)
              }}</span>
            </button>
          </template>
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
      <!-- 视口容器 -->
      <div
        class="transition-all duration-500 ease-in-out origin-center relative overflow-hidden shrink-0"
        :class="
          viewportMode === 'pc'
            ? ''
            : 'border-x-8 border-bg-muted rounded-4xl shadow-2xl'
        "
        :style="viewportStyle"
      >
        <!-- iframe 模式：只渲染当前 tab 对应的 iframe -->
        <template v-if="isIframeMode && currentSrc">
          <!-- Loading 遮罩 -->
          <Transition
            enter-active-class="transition-opacity duration-300"
            leave-active-class="transition-opacity duration-300"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <div
              v-if="!iframeLoaded"
              class="absolute inset-0 z-10 bg-bg-card flex items-center justify-center"
            >
              <Loading size-class="w-10 h-10" color-class="text-accent" />
            </div>
          </Transition>

          <!-- 当前 tab 的 iframe -->
          <iframe
            :key="currentSrc"
            :src="currentSrc"
            class="absolute inset-0 w-full h-full border-none transition-opacity duration-500"
            :class="iframeLoaded ? 'opacity-100' : 'opacity-0'"
            @load="handleIframeLoad"
          />
        </template>

        <!-- slot 模式：外部自定义内容 -->
        <slot v-else :active-tab="activeTab" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 隐藏 iframe 滚动条 */
iframe {
  scrollbar-width: none;
}
iframe::-webkit-scrollbar {
  display: none;
}
</style>
