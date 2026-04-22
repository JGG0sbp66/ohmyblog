<!-- src/components/base/card/SettingCard.vue -->
<script setup lang="ts">
import BaseCard from "./BaseCard.vue";

/**
 * 设置卡片组件
 * 基于 BaseCard，提供标题、描述和内容区域的标准布局
 * 可用于初始化流程、后台管理设置等场景
 */
interface Props {
  /**
   * 卡片标题
   */
  title?: string;

  /**
   * 卡片描述/副标题
   */
  description?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <BaseCard class="flex flex-col gap-8">
    <!-- 头部区域：标题和描述 -->
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-bold text-fg">
        <slot name="title">{{ title }}</slot>
      </h2>
      <p
        v-if="description || $slots.description"
        class="text-fg-subtle text-sm"
      >
        <slot name="description">{{ description }}</slot>
      </p>
    </div>

    <!-- 内容区域：表单、选择器等 -->
    <div class="flex flex-col gap-8">
      <slot />
    </div>

    <!-- 底部区域：按钮、操作等（可选） -->
    <slot name="footer" />
  </BaseCard>
</template>
