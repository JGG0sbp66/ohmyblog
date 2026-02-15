<!-- src/views/setup/steps/Step5SMTP.vue -->
<script setup lang="ts">
import StepLayout from "../components/StepLayout.vue";
import ModuleItem from "../components/ModuleItem.vue";
import { useLang } from "@/composables/lang.hook";
import { useSetupStore } from "@/stores/setup.store";
import { useSetupStep } from "@/composables/setup-step.hook";
import { vAutoAnimate } from "@formkit/auto-animate";

const { t } = useLang();
const setupStore = useSetupStore();
const { isSubmitting, runStep } = useSetupStep();

const handleNext = () => {
  runStep(async () => {
    // TODO: 实现 SMTP 配置保存逻辑
    console.log("SMTP configuration will be saved here");
  });
};
</script>

<template>
  <StepLayout
    :title="t('views.setup.steps.step5.title')"
    :description="t('views.setup.steps.step5.description')"
    :loading="isSubmitting"
    @next="handleNext"
  >
    <!-- 可变框容器 -->
    <div class="flex flex-col gap-4" v-auto-animate>
      <ModuleItem
        v-model="setupStore.isSMTPEnabled"
        :title="t('views.setup.steps.step5.smtp.title')"
        :description="t('views.setup.steps.step5.smtp.description')"
        :tag="t('views.setup.steps.step5.smtp.tag')"
      />
    </div>
  </StepLayout>
</template>
