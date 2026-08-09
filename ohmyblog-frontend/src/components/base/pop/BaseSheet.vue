<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { X } from "lucide-vue-next";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";

const props = defineProps<{
  modelValue: boolean;
  title?: string;
  description?: string;
  closeLabel?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const sheetRef = ref<HTMLElement | null>(null);
const dragOffset = ref(0);
const isDragging = ref(false);
const gestureActive = ref(false);
const isClosingFromDrag = ref(false);

let startY = 0;
let lastMoveTime = 0;
let dragVelocity = 0;
let activePointerId: number | null = null;
let settleTimer: number | undefined;

const sheetStyle = computed(() => {
  const style: Record<string, string> = {
    paddingBottom: "env(safe-area-inset-bottom, 1rem)",
  };

  if (gestureActive.value) {
    style.transform = `translate3d(0, ${dragOffset.value}px, 0)`;
    style.transition = isDragging.value
      ? "none"
      : "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)";
    style.willChange = "transform";
  }

  return style;
});

const clearSettleTimer = () => {
  if (settleTimer !== undefined) {
    window.clearTimeout(settleTimer);
    settleTimer = undefined;
  }
};

const resetGesture = () => {
  clearSettleTimer();
  dragOffset.value = 0;
  isDragging.value = false;
  gestureActive.value = false;
  isClosingFromDrag.value = false;
  activePointerId = null;
};

const settleBack = () => {
  isDragging.value = false;
  dragOffset.value = 0;
  clearSettleTimer();
  settleTimer = window.setTimeout(() => {
    gestureActive.value = false;
    settleTimer = undefined;
  }, 180);
};

const closeFromDrag = () => {
  isDragging.value = false;
  isClosingFromDrag.value = true;
  dragOffset.value = sheetRef.value?.offsetHeight ?? window.innerHeight;
  clearSettleTimer();
  settleTimer = window.setTimeout(() => {
    settleTimer = undefined;
    emit("update:modelValue", false);
    settleTimer = window.setTimeout(resetGesture, 180);
  }, 180);
};

const onPointerDown = (event: PointerEvent) => {
  if (
    !event.isPrimary ||
    (event.pointerType === "mouse" && event.button !== 0)
  ) {
    return;
  }

  clearSettleTimer();
  activePointerId = event.pointerId;
  startY = event.clientY;
  lastMoveTime = performance.now();
  dragVelocity = 0;
  dragOffset.value = 0;
  gestureActive.value = true;
  isDragging.value = true;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
};

const onPointerMove = (event: PointerEvent) => {
  if (!isDragging.value || event.pointerId !== activePointerId) return;

  const now = performance.now();
  const nextOffset = Math.max(0, event.clientY - startY);
  const elapsed = Math.max(now - lastMoveTime, 1);
  const instantaneousVelocity = (nextOffset - dragOffset.value) / elapsed;

  dragVelocity = dragVelocity * 0.6 + instantaneousVelocity * 0.4;
  dragOffset.value = nextOffset;
  lastMoveTime = now;
};

const onPointerEnd = (event: PointerEvent, cancelled = false) => {
  if (!isDragging.value || event.pointerId !== activePointerId) return;

  const velocity = performance.now() - lastMoveTime <= 80 ? dragVelocity : 0;
  const sheetHeight = sheetRef.value?.offsetHeight ?? window.innerHeight;
  const distanceThreshold = Math.min(120, sheetHeight * 0.25);
  const shouldClose =
    !cancelled &&
    (dragOffset.value >= distanceThreshold ||
      (dragOffset.value >= 24 && velocity >= 0.5));

  activePointerId = null;
  if (shouldClose) closeFromDrag();
  else settleBack();
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen && !isClosingFromDrag.value) resetGesture();
  },
);

onBeforeUnmount(clearSettleTimer);
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
        class="fixed inset-x-0 bottom-0 z-71 max-h-[72dvh] overflow-y-auto rounded-t-3xl border-t border-border/50 bg-bg-card px-4 pt-2 shadow-[0_-16px_48px_rgba(0,0,0,0.24)]"
        :style="sheetStyle"
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

        <slot />
      </section>
    </Transition>
  </Teleport>
</template>
