<!-- src/components/base/card/AuthCard.vue -->
<script setup lang="ts">
/**
 * AuthCard — 认证页面内容布局
 *
 * 提供标题、描述、内容区域和可选底部操作栏的标准结构，
 * 但不包含卡片外观（BaseCard），因为外壳由 AuthLayout 统一提供。
 *
 * 使用场景：Login、ForgotPassword 等认证相关页面的 slot 内容。
 *
 * Props:
 * - title:       页面标题
 * - description: 标题下方的描述文字（可选）
 *
 * Slots:
 * - #title:       覆盖标题区域（如需要自定义图标+标题组合）
 * - #description: 覆盖描述区域
 * - default:      主要内容区域
 * - #footer:      底部操作区域（可选）
 */
interface Props {
  title?: string;
  description?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 头部区域：标题和描述 -->
    <div class="flex flex-col gap-2 onload-animation">
      <h1 class="text-2xl font-bold text-fg">
        <slot name="title">{{ title }}</slot>
      </h1>
      <p
        v-if="description || $slots.description"
        class="text-fg-subtle text-sm"
      >
        <slot name="description">{{ description }}</slot>
      </p>
    </div>

    <!-- 内容区域 -->
    <slot />

    <!-- 底部区域（可选） -->
    <slot name="footer" />
  </div>
</template>
