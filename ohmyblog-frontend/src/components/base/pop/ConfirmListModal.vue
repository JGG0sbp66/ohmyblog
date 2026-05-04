<!-- src/components/base/pop/ConfirmListModal.vue -->
<script setup lang="ts">
import type { Component } from "vue";
import { FileText } from "lucide-vue-next";
import ConfirmModal from "./ConfirmModal.vue";

/**
 * ConfirmModal 的列表扩展版
 * 在问题文字和警告之间插入一个可滚动的条目列表
 */
withDefaults(
  defineProps<{
    /** 弹窗显示状态（支持 v-model） */
    modelValue: boolean;
    /** 标题栏图标 */
    icon?: Component;
    /** 弹窗标题 */
    title: string;
    /** 正文提问文字 */
    question: string;
    /** 红色警示说明，可选 */
    warning?: string;
    /** 确认按钮文字 */
    confirmText?: string;
    /** 取消按钮文字 */
    cancelText?: string;
    /** 确认按钮额外 class */
    confirmClass?: string;
    /** 确认按钮 loading 状态 */
    loading?: boolean;
    /** 列表条目：key 用于 v-for，label 为显示文字 */
    items: Array<{ key: string; label: string }>;
  }>(),
  {
    loading: false,
    confirmClass: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();
</script>

<template>
  <ConfirmModal
    :model-value="modelValue"
    :icon="icon"
    :title="title"
    :question="question"
    :warning="warning"
    :confirm-text="confirmText"
    :cancel-text="cancelText"
    :confirm-class="confirmClass"
    :loading="loading"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="emit('confirm')"
  >
    <template #list>
      <div class="border border-border rounded-xl overflow-hidden">
        <ul
          class="bg-bg-card divide-y divide-border/40 max-h-44 overflow-y-auto"
        >
          <li
            v-for="item in items"
            :key="item.key"
            class="flex items-center gap-3 px-4 py-2.5"
          >
            <FileText class="w-4 h-4 text-fg-muted shrink-0" />
            <span class="text-sm text-fg truncate min-w-0">{{ item.label }}</span>
          </li>
        </ul>
      </div>
    </template>
  </ConfirmModal>
</template>


