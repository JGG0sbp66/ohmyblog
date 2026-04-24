<!-- src/views/main/components/hero/display/HeroTitleDisplay.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from "vue";
import { useSystemStore } from "@/stores/system.store";
import { useTyping } from "@/composables/typing.hook";

const systemStore = useSystemStore();

// 从 store 获取标题数据
const heroTitle = computed(() => systemStore.personalInfo.heroTitle);
const heroSubtitles = computed(() => systemStore.personalInfo.heroSubtitles);

// 打字机效果
const { displayText, type, backspace } = useTyping(80, 50);

let currentIndex = 0;
let animationLoop: number | null = null;

// 循环播放副标题
async function playSubtitles() {
  const subtitles = heroSubtitles.value;

  if (!subtitles || subtitles.length === 0) {
    return;
  }

  // 打字当前副标题
  await type(subtitles[currentIndex], 0);

  // 停顿 2 秒
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 退格
  await backspace(0);

  // 停顿 0.5 秒
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 切换到下一个副标题
  currentIndex = (currentIndex + 1) % subtitles.length;

  // 继续循环
  animationLoop = window.setTimeout(playSubtitles, 0);
}

// TODO: 修复副标题更新后动画异常的问题
// 问题描述：当通过编辑器修改副标题并保存后，打字动画会出现异常（只展开几个字就收缩）
// 临时解决方案：刷新页面可以恢复正常
// 可能原因：
// 1. watch 触发时，正在进行的异步动画（type/backspace）没有被正确取消
// 2. 需要在 watch 中先调用 reset() 清空状态，再重新开始动画
// 3. 可能需要在 useTyping hook 中添加一个 stop() 方法来强制停止所有进行中的动画
// 4. 考虑使用 deep watch 或者监听数组的具体变化
// 监听副标题变化，重新开始动画
watch(
  heroSubtitles,
  (newSubtitles) => {
    if (animationLoop) {
      clearTimeout(animationLoop);
      animationLoop = null;
    }

    if (newSubtitles && newSubtitles.length > 0) {
      currentIndex = 0;
      playSubtitles();
    }
  },
  { immediate: false },
);

onMounted(() => {
  if (heroSubtitles.value && heroSubtitles.value.length > 0) {
    playSubtitles();
  }
});

onUnmounted(() => {
  if (animationLoop) {
    clearTimeout(animationLoop);
  }
});

// 判断是否显示组件
const shouldDisplay = computed(() => {
  return (
    heroTitle.value || (heroSubtitles.value && heroSubtitles.value.length > 0)
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
      v-if="heroTitle"
      class="text-6xl md:text-7xl lg:text-8xl font-bold mb-4"
      style="text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7)"
    >
      {{ heroTitle }}
    </h1>

    <!-- 副标题 (打字机效果) -->
    <div
      v-if="heroSubtitles && heroSubtitles.length > 0"
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
