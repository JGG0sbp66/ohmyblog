<!-- src/components/common/ImageTransition.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  src: string;
  alt?: string;
  className?: string;
  duration?: number; // 动画持续时间，单位 ms
}>();

const displayImage = ref(props.src);
const prevImage = ref("");
const isTransitioning = ref(false);

watch(
  () => props.src,
  (newVal) => {
    if (!newVal || newVal === displayImage.value) return;

    // 如果当前没图片，直接设置
    if (!displayImage.value) {
      displayImage.value = newVal;
      return;
    }

    // 记录当前图片为旧图片
    prevImage.value = displayImage.value;

    // 预加载新图片
    const img = new Image();
    img.src = newVal;

    const finishTransition = () => {
      requestAnimationFrame(() => {
        isTransitioning.value = true;
        displayImage.value = newVal;

        // 动画结束后清理
        setTimeout(() => {
          isTransitioning.value = false;
          prevImage.value = "";
        }, props.duration || 1000);
      });
    };

    img.onload = finishTransition;
    img.onerror = () => {
      console.error("Failed to load image transition:", newVal);
      finishTransition();
    };
  },
);
</script>

<template>
  <div class="relative w-full h-full overflow-hidden">
    <!-- 旧图片层 -->
    <img
      v-if="isTransitioning && prevImage"
      :src="prevImage"
      :alt="alt"
      class="absolute inset-0 z-0 h-full w-full object-cover object-center"
      v-bind="$attrs"
    />

    <!-- 新图片层 -->
    <img
      :src="displayImage"
      :alt="alt"
      class="relative h-full w-full object-cover object-center z-10"
      :class="[className, { 'image-devouring': isTransitioning }]"
      v-bind="$attrs"
    />
  </div>
</template>

<style scoped>
.image-devouring {
  /* 使用变量控制时长，默认 1s */
  animation: devour-effect v-bind("`${props.duration || 1000}ms`")
    cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes devour-effect {
  0% {
    clip-path: circle(0% at 50% 50%);
    filter: brightness(1.5) blur(10px);
  }
  100% {
    clip-path: circle(150% at 50% 50%);
    filter: brightness(1) blur(0px);
  }
}
</style>
