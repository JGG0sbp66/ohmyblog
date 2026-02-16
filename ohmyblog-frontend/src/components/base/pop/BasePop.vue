<!-- src/components/base/pop/BasePop.vue -->
<script lang="ts" setup>
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";

const props = defineProps<{
  modelValue: boolean;
  // 接收外部触发器的 ref，用于排除点击检测
  triggerRef?: HTMLElement | null;
}>();

const emit = defineEmits(["update:modelValue"]);

const panelRef = ref(null);

onClickOutside(panelRef, (event) => {
  // 如果点击的是触发器，不要在这里处理（让触发器自己的 click 事件去处理）
  if (props.triggerRef && props.triggerRef.contains(event.target as Node)) {
    return;
  }

  if (props.modelValue) {
    emit("update:modelValue", false);
  }
});
</script>

<template>
  <!-- 弹窗内容容器 -->
  <Transition name="pop">
    <div
      v-if="modelValue"
      ref="panelRef"
      class="bg-bg-card absolute z-50 mt-6 rounded-lg shadow-lg"
      :class="$attrs.class"
    >
      <slot></slot>
    </div>
  </Transition>
</template>

<style scoped>
.pop-enter-active {
  transition: all 0.2s ease-out;
}

.pop-leave-active {
  transition: all 0.15s ease-in;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
