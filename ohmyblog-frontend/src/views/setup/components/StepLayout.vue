<!-- src/views/setup/components/StepLayout.vue -->
<script setup lang="ts">
import StepButton from "@/components/common/button/StepButton.vue";

/**
 * 步骤布局组件属性接口
 */
interface Props {
  title: string; // 步骤标题
  description?: string; // 步骤描述信息
  loading?: boolean; // 下一步按钮的加载状态
  showPrev?: boolean; // 是否显示“上一步”按钮
  nextDisabled?: boolean; // 是否禁用“下一步”按钮
  nextText?: string; // “下一步”按钮自定义文本
  prevText?: string; // “上一步”按钮自定义文本
}

const props = withDefaults(defineProps<Props>(), {
  description: "",
  loading: false,
  showPrev: true,
  nextDisabled: false,
  nextText: "",
  prevText: "",
});

defineEmits(["next"]); // 定义“下一步”点击事件
</script>

<template>
  <div class="relative p-8 flex flex-col gap-8">
    <!-- 头部区域：包含标题和副标题/描述 -->
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-bold text-text-main">
        <slot name="title">{{ title }}</slot>
      </h2>
      <p
        v-if="description || $slots.description"
        class="text-text-icon text-sm"
      >
        <slot name="description">{{ description }}</slot>
      </p>
    </div>

    <!-- 内容区域：放置步骤的核心表单或选择器 -->
    <div class="flex flex-col gap-8">
      <slot />
    </div>

    <!-- 底部按钮区域：统一的导航控制 -->
    <StepButton
      :loading="loading"
      :showPrev="showPrev"
      :nextDisabled="nextDisabled"
      :nextText="nextText"
      :prevText="prevText"
      @next="$emit('next')"
    />
  </div>
</template>
