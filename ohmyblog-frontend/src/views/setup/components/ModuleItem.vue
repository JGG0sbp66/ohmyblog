<!-- src/views/setup/components/ModuleItem.vue -->
<script setup lang="ts">
import ButtonToggle from "@/components/base/button/ButtonToggle.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";

/**
 * 设置页面专用的功能模块项组件
 * 展示标题、描述、状态开关以及可选的标签
 */
defineProps<{
  /** 模块名称 */
  title: string;
  /** 模块功能描述 */
  description: string;
  /** 可选的展示标签文本（如 "可选"、"推荐"） */
  tag?: string;
}>();

/** 绑定开关状态 */
const modelValue = defineModel<boolean>({ default: false });
</script>

<template>
  <div
    class="flex items-center justify-between rounded-2xl bg-bg-secondary/50 p-5"
  >
    <div class="flex-1 pr-4">
      <h3 class="flex items-center gap-2 text-base font-semibold text-text-main">
        {{ title }}
        <BaseTag v-if="tag" size="sm">{{ tag }}</BaseTag>
      </h3>
      <p class="mt-1 text-sm text-text-secondary leading-relaxed">
        {{ description }}
      </p>
    </div>

    <ButtonToggle v-model="modelValue" />
  </div>
</template>
