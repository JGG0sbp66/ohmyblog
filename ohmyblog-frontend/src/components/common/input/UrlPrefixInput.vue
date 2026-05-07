<!-- src/components/common/input/UrlPrefixInput.vue -->
<script setup lang="ts">
import BaseInputWrapper from "@/components/base/input/BaseInputWrapper.vue";

/**
 * UrlPrefixInput — 带 URL 前缀的输入框
 *
 * 布局：[prefix 前缀区] [输入框]
 *
 * Props:
 * - prefix:      左侧显示的 URL 前缀文字（默认 "/"）
 * - placeholder: 输入框占位文字
 * - error:       错误提示文字，传入后显示红色错误环及下方提示
 *
 * v-model: 输入框当前值
 */
interface Props {
  prefix?: string;
  placeholder?: string;
  error?: string;
}

withDefaults(defineProps<Props>(), {
  prefix: "/",
  placeholder: "",
});

const emit = defineEmits<{ blur: [] }>();
const modelValue = defineModel<string>({ default: "" });
</script>

<template>
  <BaseInputWrapper :error="error">
    <!-- 前缀区域：背景略深，右侧分隔线 -->
    <template #prefix>
      <div
        class="h-10 px-3 flex items-center shrink-0 border-r border-border/60 bg-bg select-none"
      >
        <span class="text-xs font-mono text-fg-muted whitespace-nowrap">
          {{ prefix }}
        </span>
      </div>
    </template>

    <!-- 输入框 -->
    <input
      v-model="modelValue"
      :placeholder="placeholder"
      class="flex-1 min-w-0 h-10 bg-transparent px-3 outline-none font-mono text-sm placeholder:text-fg-soft"
      spellcheck="false"
      autocomplete="off"
      @blur="emit('blur')"
    />
  </BaseInputWrapper>
</template>
