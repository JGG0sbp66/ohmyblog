<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/composables/lang.hook';

interface Props {
    title?: string;      // 进度条左上角的文字
    currentStep: number; // 当前步骤
    totalSteps: number;  // 总步骤
}

const props = defineProps<Props>();
const { t } = useI18n();

// 自动计算百分比宽度
const progressWidth = computed(() => {
    const percentage = (props.currentStep / props.totalSteps) * 100;
    return `${Math.min(100, Math.max(0, percentage))}%`;
});
</script>

<template>
    <div class="w-full space-y-2">
        <!-- 进度文字描述 -->
        <div class="flex justify-between text-sm text-text-icon px-1">
            <span>{{ title }}</span>
            <span>{{ t('components.base.progress.BaseProgress.step', { current: currentStep, total: totalSteps }) }}</span>
        </div>

        <!-- 进度条底色 -->
        <div class="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
            <!-- 实际进度填充 -->
            <div class="h-full bg-primary transition-all duration-200" :style="{ width: progressWidth }"></div>
        </div>
    </div>
</template>