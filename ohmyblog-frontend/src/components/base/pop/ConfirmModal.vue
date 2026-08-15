<!-- src/components/base/pop/ConfirmModal.vue -->
<script setup lang="ts">
import { computed, type Component } from "vue";
import { TriangleAlert, Info } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import BaseModal from "./BaseModal.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";

const props = withDefaults(
  defineProps<{
    /** 弹窗显示状态（支持 v-model） */
    modelValue: boolean;
    /** 标题栏图标，默认 TriangleAlert */
    icon?: Component;
    /** 弹窗标题 */
    title: string;
    /** 正文提问文字 */
    question: string;
    /** 红色警示说明，可选 */
    warning?: string;
    /** 确认按钮文字，默认 common.confirm */
    confirmText?: string;
    /** 取消按钮文字，默认 common.cancel */
    cancelText?: string;
    /** 确认按钮额外 class，用于覆盖颜色等样式 */
    confirmClass?: string;
    /** 标题栏图标颜色 class，默认使用主题色；危险操作需显式传入红色 */
    iconClass?: string;
    /** 确认按钮 loading 状态 */
    loading?: boolean;
  }>(),
  {
    iconClass: "text-accent",
    confirmClass: "",
    loading: false,
  },
);

const emit = defineEmits<{
  /** 更新弹窗显示状态（v-model） */
  "update:modelValue": [value: boolean];
  /** 点击确认按钮 */
  confirm: [];
}>();

const { t } = useLang();

/**
 * 图标默认值只能在这里兜，不能写进 withDefaults。
 *
 * lucide 的图标是函数式组件（`(props, { slots }) => h(...)`），而 Vue 解析 prop
 * 默认值时，只要声明类型不是 Function 而默认值是个函数，就会把它当成「工厂函数」
 * 调用一次取返回值——于是 TriangleAlert(props) 少了第二个 ctx 参数，
 * 内部解构 { slots } 直接抛 TypeError，整棵组件树渲染失败。
 */
const iconComponent = computed<Component>(() => props.icon ?? TriangleAlert);
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    max-width="max-w-lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <component :is="iconComponent" class="w-5 h-5" :class="iconClass" />
        <h2 class="text-xl font-bold text-fg">{{ title }}</h2>
      </div>
    </template>

    <div class="flex flex-col gap-3">
      <p class="text-fg text-sm">{{ question }}</p>
      <slot />
      <slot name="list" />
      <div v-if="warning" class="flex items-center gap-1 text-red-500">
        <Info class="w-3.5 h-3.5 shrink-0" />
        <p class="text-xs">{{ warning }}</p>
      </div>
    </div>

    <template #footer>
      <ButtonSecondary
        :text="cancelText ?? t('common.cancel')"
        class="min-w-24 py-2"
        @click="emit('update:modelValue', false)"
      />
      <ButtonPrimary
        :text="confirmText ?? t('common.confirm')"
        :loading="loading"
        :class="['min-w-24 py-2', confirmClass]"
        @click="emit('confirm')"
      />
    </template>
  </BaseModal>
</template>
