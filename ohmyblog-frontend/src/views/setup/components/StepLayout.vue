<!-- src/views/setup/components/StepLayout.vue -->
<script setup lang="ts">
import SettingCard from "@/components/base/card/SettingCard.vue";
import StepButton from "@/components/common/button/StepButton.vue";

/**
 * 步骤布局组件属性接口
 * 基于 SettingCard，添加步骤导航功能
 */
interface Props {
  title: string; // 步骤标题
  description?: string; // 步骤描述信息
  loading?: boolean; // 下一步按钮的加载状态
  showPrev?: boolean; // 是否显示"上一步"按钮
  nextText?: string; // "下一步"按钮自定义文本
  prevText?: string; // "上一步"按钮自定义文本
}

const props = withDefaults(defineProps<Props>(), {
  description: "",
  loading: false,
  showPrev: true,
  nextText: "",
  prevText: "",
});

defineEmits(["next"]); // 定义"下一步"点击事件
</script>

<template>
  <SettingCard :title="title" :description="description">
    <!-- 透传标题插槽 -->
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>

    <!-- 透传描述插槽 -->
    <template v-if="$slots.description" #description>
      <slot name="description" />
    </template>

    <!-- 内容区域 -->
    <slot />

    <!-- 底部按钮区域 -->
    <template #footer>
      <StepButton
        :loading="loading"
        :showPrev="showPrev"
        :nextText="nextText"
        :prevText="prevText"
        @next="$emit('next')"
      />
    </template>
  </SettingCard>
</template>
