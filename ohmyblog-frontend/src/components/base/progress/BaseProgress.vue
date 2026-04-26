<!-- src/components/base/progress/BaseProgress.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useLang } from "@/composables/lang.hook";

interface Props {
  title?: string; // 进度条左上角的文字
  currentStep: number; // 当前步骤
  totalSteps: number; // 总步骤
}

const props = defineProps<Props>();
const { t } = useLang();

// 自动计算百分比宽度
const progressWidth = computed(() => {
  const percentage = (props.currentStep / props.totalSteps) * 100;
  return `${Math.min(100, Math.max(0, percentage))}%`;
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- 进度文字描述 -->
    <div class="flex justify-between items-end mb-1 text-sm text-fg-subtle px-1">
      <span>{{ title }}</span>
      <span>{{
        t("components.base.progress.BaseProgress.step", {
          current: currentStep,
          total: totalSteps,
        })
      }}</span>
    </div>

    <!-- 进度条底色 -->
    <div class="w-full h-2 bg-bg-muted rounded-full overflow-hidden">
      <!-- 实际进度填充 -->
      <div class="h-full bg-accent" :style="{ width: progressWidth }"></div>
    </div>
  </div>
</template>
