<!-- src/views/admin/components/posts/editor/setting/PostEditorSettingItem.vue -->
<script setup lang="ts">
import FieldLabel from "@/components/base/input/FieldLabel.vue";

/**
 * PostEditorSettingItem — 文章设置面板中的通用设置块
 *
 * 布局：标题行（icon slot + label 文字 + BaseTooltip 提示）+ 内容区域 slot
 *
 * Props:
 * - label:   标题文字，统一 uppercase 加粗风格
 * - tooltip: 说明文字，通过 BaseTooltip 展示
 *
 * Slots:
 * - #icon:    标题行左侧图标（推荐 w-4 h-4 text-fg-subtle）
 * - default:  内容操作区域
 */
defineProps<{
  label: string;
  tooltip: string;
}>();
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- 标题行：icon + 文字 + 提示 -->
    <FieldLabel :label="label" :tooltip="tooltip">
      <template #icon>
        <slot name="icon" />
      </template>
    </FieldLabel>
    <!-- 内容区域 -->
    <div>
      <slot />
    </div>
  </div>
</template>
