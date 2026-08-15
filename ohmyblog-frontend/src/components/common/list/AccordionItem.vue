<!--
  src/components/common/list/AccordionItem.vue
  通用手风琴项组件：可展开/收起的面板，包含头部标题区域与内容区域。

  也是拖拽排序的承载单元（见 composables/list-drag.hook）：整张卡片都是拖拽区，
  没有手柄按钮。两处例外靠属性标记：删除按钮 data-no-drag（永不起拖），
  标题输入框 data-drag-hold（按住一下才起拖，直接拖仍是选文字）。
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
  /** 是否可拖拽排序：只影响光标，事件仍由宿主绑定 */
  sortable?: boolean;
  /** 是否正被拖起：给一点边框高亮，配合 hook 的放大与阴影 */
  dragging?: boolean;
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
  <div
    class="border rounded-xl overflow-hidden transition-colors duration-200"
    :class="dragging ? 'border-accent/40' : 'border-fg-muted/10'"
  >
    <!-- 头部：点击区域（同时也是拖拽握持区） -->
    <div
      class="flex items-center justify-between gap-3 px-4 py-3 bg-bg-muted/30 select-none transition-colors"
      :class="
        sortable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      "
      @click="$emit('toggle')"
    >
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!--
          展开指示箭头。
          带 data-no-drag：指针压在它上面时只切换展开态，不进入拖拽 —— 否则想点开一组
          却因为手抖了几像素而把它拖走。点击照旧由头部那层的 @click 处理。
        -->
        <RiArrowDownSLine
          data-no-drag
          class="w-4 h-4 text-fg-muted transition-transform duration-200 shrink-0"
          :class="{ '-rotate-90': !expanded }"
        />
        <!-- 标题插槽：输入框要能点、能选字，所以是「按住才起拖」 -->
        <div class="flex-1 min-w-0" data-drag-hold @click.stop>
          <slot name="header" />
        </div>
      </div>

      <!-- 删除按钮 -->
      <div data-no-drag @click.stop>
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
