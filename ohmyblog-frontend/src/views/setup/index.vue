<!-- src/views/setup/index.vue -->
<script setup lang="ts">
import TypingBrand from '@/components/icon/TypingBrand.vue';
import Footer from '@/components/common/layout/Footer.vue';
import BaseProgress from '@/components/base/progress/BaseProgress.vue';

import { vAutoAnimate } from '@formkit/auto-animate'
import { useSetupStore } from '@/stores/setup.store';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t } = useI18n();
const stepStore = useSetupStore();

// 引入步骤组件
import Step1Appearance from '@/views/setup/steps/Step1Appearance.vue';
import Step2Info from '@/views/setup/steps/Step2Info.vue';

const stepComponents = [
    Step1Appearance,
    Step2Info
]

const CurrentStepComponent = computed(() => {
    return stepComponents[stepStore.currentStep - 1];
});
</script>

<template>
    <div class="min-h-screen flex flex-col bg-bg-primary overflow-x-hidden">

        <!-- 包裹区域 -->
        <main class="flex-1 flex flex-col items-center pt-20 pb-12 p-4 md:p-8">

            <div class="w-full max-w-122 lg:max-w-5xl flex flex-col gap-15">
                <!-- 进度条区域 -->
                <div class="w-full">
                    <BaseProgress :currentStep="stepStore.currentStep" :totalSteps="stepStore.totalSteps"
                        :title="stepStore.currentTitle" />
                </div>

                <!-- 初始化区域 -->
                <div class="w-full gap-12 max-w-5xl flex flex-1 items-center justify-center">

                    <!-- 左侧：Logo 展示区 -->
                    <div class="hidden lg:block w-full">
                        <TypingBrand :line1="t('components.icon.TypingBrand.line1')"
                            :line2="t('components.icon.TypingBrand.line2')"
                            :line3="t('components.icon.TypingBrand.line3')" />
                    </div>

                    <!-- 右侧：表单流程区 -->
                    <div v-auto-animate class="w-full max-w-122 bg-bg-card rounded-3xl">

                        <!-- TODO: 完善流程区域 -->
                        <component :is="CurrentStepComponent" :key="stepStore.currentStep" />
                    </div>
                </div>
            </div>
        </main>

        <!-- 底部版权信息 -->
        <Footer />
    </div>
</template>
