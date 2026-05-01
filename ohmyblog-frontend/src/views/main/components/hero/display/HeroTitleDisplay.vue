<!-- src/views/main/components/hero/display/HeroTitleDisplay.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from "vue";
import { useSystemStore } from "@/stores/system.store";
import { useTyping } from "@/composables/typing.hook";

const systemStore = useSystemStore();

// 打字机效果
const { displayText, type, backspace, reset } = useTyping(80, 50);

let currentIndex = 0;
let currentLoopId = 0;

// 循环播放副标题
async function playSubtitles() {
  const loopId = ++currentLoopId;

  // 内部辅助函数，检查当前循环是否仍然有效
  const isValid = () => loopId === currentLoopId;

  while (isValid()) {
    const subtitles = systemStore.personalInfo.heroSubtitles;

    if (!subtitles || subtitles.length === 0) {
      break;
    }

    // 1. 打字当前副标题
    await type(subtitles[currentIndex], 0);
    if (!isValid()) break;

    // 2. 停顿 2 秒
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (!isValid()) break;

    // 3. 退格
    await backspace(0);
    if (!isValid()) break;

    // 4. 停顿 0.5 秒
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!isValid()) break;

    // 5. 切换到下一个副标题
    currentIndex = (currentIndex + 1) % subtitles.length;
  }
}

// 监听副标题变化，重新开始动画
watch(
  () => systemStore.personalInfo.heroSubtitles,
  (newSubtitles) => {
    // 增加 ID 以终止旧的 while 循环
    currentLoopId++;
    // 重置打字机状态（清空文本并停止 hook 内的 setInterval）
    reset();

    if (newSubtitles && newSubtitles.length > 0) {
      currentIndex = 0;
      playSubtitles();
    }
  },
  { immediate: false, deep: true },
);

onMounted(() => {
  if (
    systemStore.personalInfo.heroSubtitles &&
    systemStore.personalInfo.heroSubtitles.length > 0
  ) {
    playSubtitles();
  }
});

onUnmounted(() => {
  currentLoopId++;
  reset();
});

// 判断是否显示组件
const shouldDisplay = computed(() => {
  return (
    systemStore.personalInfo.heroTitle ||
    (systemStore.personalInfo.heroSubtitles &&
      systemStore.personalInfo.heroSubtitles.length > 0)
  );
});
</script>

<template>
  <div
    v-if="shouldDisplay"
    class="absolute inset-0 z-10 flex flex-col items-center justify-center text-white pointer-events-none"
  >
    <!-- 主标题 -->
    <h1
      v-if="systemStore.personalInfo.heroTitle"
      class="text-6xl md:text-7xl lg:text-8xl font-bold mb-4"
      style="text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7)"
    >
      {{ systemStore.personalInfo.heroTitle }}
    </h1>

    <!-- 副标题 (打字机效果) -->
    <div
      v-if="
        systemStore.personalInfo.heroSubtitles &&
        systemStore.personalInfo.heroSubtitles.length > 0
      "
      class="text-lg md:text-xl lg:text-2xl font-semibold min-h-[2em] flex items-center"
      style="text-shadow: 1px 1px 6px rgba(0, 0, 0, 0.6)"
    >
      <span>{{ displayText }}</span>
      <span class="typing-cursor ml-1">|</span>
    </div>
  </div>
</template>

<style scoped>
.typing-cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
