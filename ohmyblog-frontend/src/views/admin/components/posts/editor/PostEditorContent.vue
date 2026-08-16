<!-- src/views/admin/components/posts/editor/PostEditorContent.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useEditorHeaderCollapse } from "@/composables/editor-header.hook";
import { useKeyboardInset } from "@/composables/keyboard-inset.hook";
import { useEditorDock } from "@/composables/editor-dock.hook";
import PostEditorTitle from "./content/PostEditorTitle.vue";
import PostEditorSubtitle from "./content/PostEditorSubtitle.vue";
import PostEditorBody from "./content/PostEditorBody.vue";

/**
 * PostEditorContent — 编辑器内容区域主入口
 *
 * 组合 Title 和 Body 两个子组件。
 * v-model:title              → 文章标题
 * v-model:subtitle           → 文章副标题（主标题下方的说明性文字）
 * v-model:content            → ProseMirror JSON
 * v-model:contentText        → 纯文本（搜索/预览）
 * v-model:contentHtml        → HTML（前台展示/RSS）
 * v-model:totalCharCount     → 全文字符数（来自 CharacterCount）
 * v-model:selectedCharCount  → 当前选区字符数
 */
const title = defineModel<string>("title", { default: "" });
const subtitle = defineModel<string>("subtitle", { default: "" });
const content = defineModel<object | undefined>("content");
const contentText = defineModel<string>("contentText", { default: "" });
const contentHtml = defineModel<string>("contentHtml", { default: "" });
const totalCharCount = defineModel<number>("totalCharCount", { default: 0 });
const selectedCharCount = defineModel<number>("selectedCharCount", {
  default: 0,
});

/**
 * 编辑页真正滚动的是本组件这层容器（PostEditor.page 的 BaseCard 是
 * flex-1 overflow-hidden，滚动被吃在内部），AdminLayout 的 <main> 在这个路由下
 * 并不滚动。移动端顶部栏的收起信号因此只能从这里发出。
 */
const scrollRef = ref<HTMLElement | null>(null);
useEditorHeaderCollapse(scrollRef);

/**
 * 移动端底部留白 = 底部浮层实测高度（工具条 [+ 插入面板]）+ 键盘遮挡量。
 *
 * 两个作用，第二个才是重点：
 * 1. 最后几行不被浮层压住、能滚上来；
 * 2. **稳住滚动位置**。浮层是 fixed 的、不占文档流，而键盘收起时 layout viewport
 *    会长回来（interactive-widget=resizes-content），滚动容器 clientHeight 增大、
 *    maxScroll 缩小，文档一短 scrollTop 就被夹成 0 —— 表现是「一点加号，页面跳回
 *    文章开头」。留白与容器高度同步增减，maxScroll 保持不变，位置就不动了。
 *    详见 editor-dock.hook 的注释。
 *
 * dockHeight 是浮层用 ResizeObserver 实测上报的，不是常量：面板高度取决于键盘退场
 * 后腾出多少空间，只有运行时才知道。
 * inset 只在 iOS（resizes-visual）下非零 —— 那边 layout viewport 不缩，键盘遮住的
 * 那段要另外算进来。
 *
 * 加在内层内容块的 padding 上（而不是滚动容器的 height 上）是有意的：
 * 它只增大 scrollHeight，不改 clientHeight —— useEditorHeaderCollapse 靠
 * clientHeight 变化来识别「这次滚动是布局自己造成的」，动了那个值会误触发它的
 * 防振荡分支。
 *
 * scrollPaddingBottom 是给浏览器把光标滚进视野时用的：光标落在末尾几行时，
 * 没有它会正好停在浮层边缘之下。
 */
const { inset } = useKeyboardInset();
const { dockHeight } = useEditorDock();
const bottomGap = computed(() => dockHeight.value + inset.value);
</script>

<template>
  <!-- data-editor-scroll：给 MobileEditorToolbar 一个稳定的抓手，用来在开合插入面板
       期间按住 scrollTop（见该组件 holdScroll 的注释）。不用 .overflow-y-auto 类名去找，
       那是样式，改个 class 就会悄悄失效 -->
  <div
    ref="scrollRef"
    data-editor-scroll
    class="flex-1 overflow-y-auto bg-bg-muted/10"
    :style="{ scrollPaddingBottom: `${bottomGap}px` }"
  >
    <!-- 内容宽度限制：适宜阅读的最大宽，居中对齐 -->
    <div
      class="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-8 sm:py-10"
      :style="{ paddingBottom: `calc(2.5rem + ${bottomGap}px)` }"
    >
      <!-- 标题 + 副标题：紧挨成组（gap-2），间距小于容器的 gap-4 节奏 -->
      <div class="flex flex-col gap-2">
        <PostEditorTitle v-model="title" />
        <PostEditorSubtitle v-model="subtitle" />
      </div>

      <!-- 分隔线 -->
      <div class="border-b border-border/30" />

      <!-- 正文 -->
      <PostEditorBody
        v-model:json="content"
        v-model:text="contentText"
        v-model:html="contentHtml"
        v-model:total-char-count="totalCharCount"
        v-model:selected-char-count="selectedCharCount"
      />
    </div>
  </div>
</template>
