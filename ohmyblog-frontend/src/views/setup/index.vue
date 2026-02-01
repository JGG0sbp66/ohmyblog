<!-- src/views/setup/index.vue -->
<script setup lang="ts">
import TypingBrand from "@/components/icon/TypingBrand.vue";
import Footer from "@/components/common/layout/Footer.vue";
import BaseProgress from "@/components/base/progress/BaseProgress.vue";
import PersonalizationPreview from "./components/PersonalizationPreview.vue";

import { vAutoAnimate } from "@formkit/auto-animate";
import { useSetupStore } from "@/stores/setup.store";
import { useLang } from "@/composables/lang.hook";
import { computed } from "vue";

const { t } = useLang();
const stepStore = useSetupStore();

// 引入步骤组件
import Step1Appearance from "@/views/setup/steps/Step1Appearance.vue";
import Step2Info from "@/views/setup/steps/Step2Info.vue";
import Step3Admin from "@/views/setup/steps/Step3Admin.vue";
import Step4Personalization from "@/views/setup/steps/Step4Personalization.vue";

const stepComponents = [
  Step1Appearance,
  Step2Info,
  Step3Admin,
  Step4Personalization,
];

const CurrentStepComponent = computed(() => {
  return stepComponents[stepStore.currentStep - 1];
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-bg-primary overflow-x-hidden">
    <!-- main 撑满除 Footer 外的所有高度 -->
    <main class="flex-1 flex flex-col p-4 md:p-8 gap-6 md:gap-10">
      <!-- 进度条区域：内部间距由 main 的 gap 控制 -->
      <div class="w-full max-w-5xl mx-auto">
        <BaseProgress
          :currentStep="stepStore.currentStep"
          :totalSteps="stepStore.totalSteps"
          :title="stepStore.currentTitle"
        />
      </div>

      <!-- 初始化/表单核心区域：使用 flex-1 占据所有剩余高度 -->
      <div class="flex-1 flex items-center justify-center">
        <div class="w-full max-w-5xl flex items-center justify-center gap-12">
          <!-- 左侧：展示区 -->
          <div v-auto-animate class="hidden lg:block w-full">
            <div
              v-if="stepStore.currentStep === 4 && stepStore.isPersonalized"
              class="bg-bg-card rounded-3xl shadow-xl p-6"
            >
              <PersonalizationPreview />
            </div>
            <TypingBrand
              v-else
              :line1="t('components.icon.TypingBrand.line1')"
              :line2="t('components.icon.TypingBrand.line2')"
              :line3="t('components.icon.TypingBrand.line3')"
            />
          </div>

          <!-- 右侧：表单流程区 -->
          <div
            v-auto-animate
            class="w-full max-w-122 bg-bg-card rounded-3xl shadow-xl"
          >
            <component
              :is="CurrentStepComponent"
              :key="stepStore.currentStep"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- 底部版权信息 -->
    <Footer></Footer>
  </div>
</template>
