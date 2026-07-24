<!--
  src/components/common/list/AccordionItem.vue
  通用手风琴项组件：可展开/收起的面板，包含头部标题区域与内容区域。
-->
<script setup lang="ts">
import DeleteButton from "@/components/common/button/DeleteButton.vue";
import { RiArrowDownSLine } from "@remixicon/vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";

defineProps<{
  /** 是否展开 */
  expanded?: boolean;
  /** 删除按钮的提示文字 */
  deleteTitle?: string;
}>();

defineEmits<{
  /** 切换展开/收起 */
  (e: "toggle"): void;
  /** 删除该项 */
  (e: "remove"): void;
}>();

const [contentRef] = useAutoAnimate();
</script>

<template>
  <div class="border border-fg-muted/10 rounded-xl overflow-hidden">
    <!-- 头部：点击区域 -->
    <div
      class="flex items-center justify-between gap-3 px-4 py-3 bg-bg-muted/30 cursor-pointer select-none transition-colors"
      @click="$emit('toggle')"
    >
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- 展开指示箭头 -->
        <RiArrowDownSLine
          class="w-4 h-4 text-fg-muted transition-transform duration-200 shrink-0"
          :class="{ '-rotate-90': !expanded }"
        />
        <!-- 标题插槽 -->
        <div class="flex-1 min-w-0" @click.stop>
          <slot name="header" />
        </div>
      </div>

      <!-- 删除按钮 -->
      <div @click.stop>
        <DeleteButton :title="deleteTitle" @click="$emit('remove')" />
      </div>
    </div>

    <!-- 内容区域（展开时显示，带动画） -->
    <div ref="contentRef">
      <div v-if="expanded" class="px-4 py-3">
        <slot />
      </div>
    </div>
  </div>
</template>
