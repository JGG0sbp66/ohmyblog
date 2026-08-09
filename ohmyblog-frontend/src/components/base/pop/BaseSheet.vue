<script setup lang="ts">
import { X } from "lucide-vue-next";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useSheetDrag } from "@/components/base/pop/composables/sheet-drag.hook";

/**
 * 移动端底部弹层：负责遮罩、标题区、内容插槽与进出场动画。
 * 展开、收起和关闭的拖拽状态机由 useSheetDrag 单独维护。
 */
const props = defineProps<{
  modelValue: boolean;
  title?: string;
  description?: string;
  closeLabel?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const {
  sheetRef,
  sheetStyle,
  isDragging,
  isExpanded,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
} = useSheetDrag({
  isOpen: () => props.modelValue,
  close: () => emit("update:modelValue", false),
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-70 bg-black/45 backdrop-blur-[2px]"
        @click="emit('update:modelValue', false)"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]"
      leave-active-class="transition-transform duration-180 ease-in"
      enter-from-class="translate-y-full"
      leave-to-class="translate-y-full"
    >
      <section
        v-if="modelValue"
        ref="sheetRef"
        class="fixed inset-x-0 bottom-0 z-71 flex flex-col overflow-hidden rounded-t-3xl border-t border-border/50 bg-bg-card px-4 pt-2 shadow-[0_-16px_48px_rgba(0,0,0,0.24)]"
        :style="sheetStyle"
        :data-expanded="isExpanded"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="mx-auto mb-1 flex h-5 w-16 touch-none items-center justify-center"
          :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
          aria-hidden="true"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerEnd"
          @pointercancel="onPointerEnd($event, true)"
        >
          <div class="h-1 w-10 rounded-full bg-fg-muted/25" />
        </div>

        <div v-if="title || $slots.header" class="mb-3">
          <slot name="header">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-base font-semibold text-fg">{{ title }}</h2>
                <p v-if="description" class="mt-0.5 text-xs text-fg-muted">
                  {{ description }}
                </p>
              </div>
              <div class="h-9 w-9 shrink-0">
                <ButtonSecondary
                  class="h-full! w-full! p-0!"
                  :aria-label="closeLabel"
                  @click="emit('update:modelValue', false)"
                >
                  <X class="h-4 w-4" />
                </ButtonSecondary>
              </div>
            </div>
          </slot>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <slot :expanded="isExpanded" />
        </div>
      </section>
    </Transition>
  </Teleport>
</template>
