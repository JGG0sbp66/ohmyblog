<!-- src/components/base/pop/BaseModal.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import { onClickOutside, useMagicKeys } from "@vueuse/core";

/**
 * Props 定义
 */
const props = withDefaults(
  defineProps<{
    /** 弹窗显示状态（支持 v-model） */
    modelValue: boolean;
    /** 弹窗最大宽度，默认 max-w-md (448px) */
    maxWidth?: string;
  }>(),
  {
    maxWidth: "max-w-md",
  },
);

/**
 * Emits 定义
 */
const emit = defineEmits<{
  /** 更新弹窗显示状态（v-model） */
  "update:modelValue": [value: boolean];
}>();

/**
 * 弹窗容器的 DOM 引用
 * 用于 onClickOutside 检测点击外部
 */
const modalRef = ref<HTMLElement | null>(null);

/**
 * 点击外部关闭逻辑
 * 使用 VueUse 的 onClickOutside 自动检测点击事件
 * 当点击发生在 modalRef 外部时，关闭弹窗
 */
onClickOutside(modalRef, () => {
  if (props.modelValue) {
    emit("update:modelValue", false);
  }
});

/**
 * ESC 键关闭逻辑
 * 使用 VueUse 的 useMagicKeys 监听键盘事件
 * 当按下 ESC 键时，关闭弹窗
 */
const keys = useMagicKeys();
watch(
  () => keys.Escape?.value,
  (pressed) => {
    if (pressed && props.modelValue) {
      emit("update:modelValue", false);
    }
  },
);
</script>

<template>
  <!-- 使用 Teleport 将弹窗渲染到 body 下，避免 z-index 和 overflow 问题 -->
  <Teleport to="body">
    <!-- 遮罩层过渡动画 -->
    <Transition name="modal-backdrop">
      <!-- 遮罩层：模糊背景，居中布局 -->
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/20"
      >
        <!-- 弹窗内容过渡动画 -->
        <Transition name="modal-content">
          <!-- 
            弹窗容器：
            - ref="modalRef" 用于点击外部检测
            - 使用主题背景色和圆角
            - 默认最大宽度 448px (max-w-md)
          -->
          <div
            v-if="modelValue"
            ref="modalRef"
            :class="[
              'bg-bg-card relative w-full rounded-2xl shadow-2xl',
              maxWidth,
            ]"
          >
            <!-- 头部插槽 -->
            <div v-if="$slots.header" class="px-6 py-4">
              <slot name="header" />
            </div>

            <!-- 内容插槽 -->
            <div class="px-6 py-8 bg-bg-card">
              <slot />
            </div>

            <!-- 底部插槽 -->
            <div
              v-if="$slots.footer"
              class="px-6 py-4 flex items-center justify-end gap-3"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/**
 * 遮罩层动画
 * 进入：快速淡入（150ms）
 * 离开：快速淡出（100ms）
 */
.modal-backdrop-enter-active {
  transition: opacity 0.15s ease-out;
}

.modal-backdrop-leave-active {
  transition: opacity 0.1s ease-in;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

/**
 * 弹窗内容动画
 * 进入：快速淡入 + 从中心弹出（150ms）
 * 离开：快速淡出 + 缩小到中心（120ms）
 */
.modal-content-enter-active {
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-content-leave-active {
  transition: all 0.12s ease-in;
}

.modal-content-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
