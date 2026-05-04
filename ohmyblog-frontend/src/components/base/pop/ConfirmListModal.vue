<!-- src/components/base/pop/ConfirmListModal.vue -->
<script setup lang="ts">
import type { Component } from "vue";
import ConfirmModal from "./ConfirmModal.vue";
import ConfirmItemList from "@/components/common/list/ConfirmItemList.vue";
import ConfirmItemRow from "@/components/common/list/ConfirmItemRow.vue";

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
    items: Array<{
      key: string;
      label: string;
      /** 右侧显示的额外信息（如状态标签文案） */
      tag?: string;
      /** 状态标签对应的 class（用于控制颜色） */
      tagClass?: string;
    }>;
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
    <slot />
    <template #list>
      <ConfirmItemList :items="items">
        <template #default="{ item, index }">
          <slot name="item" :item="item" :index="index">
            <ConfirmItemRow
              :index="index"
              :label="item.label"
              :tag="item.tag"
              :tagClass="item.tagClass"
            />
          </slot>
        </template>
      </ConfirmItemList>
    </template>
  </ConfirmModal>
</template>
