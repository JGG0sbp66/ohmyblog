<!-- src/components/common/list/ConfirmItemRow.vue -->
<script setup lang="ts">
import BaseTag from "@/components/base/tag/BaseTag.vue";

/**
 * 弹窗列表中的单行项目组件
 * 封装了 [序号 / 标题 + 右侧插槽] 的标准排版
 */
defineProps<{
  /** 索引（从 0 开始） */
  index: number;
  /** 标题/文案 */
  label: string;
  /** 可选：右侧显示的标签文案 */
  tag?: string;
  /** 可选：标签对应的颜色类 */
  tagClass?: string;
}>();
</script>

<template>
  <li class="flex items-center gap-4 px-6 py-3">
    <!-- 左侧序号 -->
    <span class="font-mono text-[10px] text-fg-subtle w-8 shrink-0 text-right">
      {{ (index + 1).toString().padStart(2, "0") }} /
    </span>

    <!-- 中间标题 -->
    <span class="text-sm text-fg truncate flex-1 font-medium">
      {{ label }}
    </span>

    <!-- 右侧区域：默认显示 BaseTag，也可以通过插槽自定义 -->
    <div class="flex items-center gap-1.5 shrink-0">
      <slot>
        <BaseTag
          v-if="tag"
          :show-icon="false"
          class="text-[10px] px-1.5 py-0.5"
          :class="tagClass"
        >
          {{ tag }}
        </BaseTag>
      </slot>
    </div>
  </li>
</template>
