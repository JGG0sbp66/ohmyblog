<!-- src/views/setup/steps/Step4Personalization.vue -->
<script setup lang="ts">
import StepLayout from "../components/StepLayout.vue";
import ModuleItem from "../components/ModuleItem.vue";
import PersonalizationPreview from "../components/PersonalizationPreview.vue";
import { useLang } from "@/composables/lang.hook";
import { useSetupStore } from "@/stores/setup.store";
import { useSystemStore } from "@/stores/system.store";
import { useSetupStep } from "@/composables/setup-step.hook";
import { upsertConfig } from "@/api/config.api";
import { vAutoAnimate } from "@formkit/auto-animate";

const { t } = useLang();
const setupStore = useSetupStore();
const systemStore = useSystemStore();
const { isSubmitting, runStep } = useSetupStep();

const handleNext = () => {
  runStep(async () => {
    // 保存头像, hero横幅的URL
    return upsertConfig({
      configKey: "personal_info",
      configValue: systemStore.personalInfo,
    });
  });
};
</script>

<template>
  <StepLayout
    :title="t('views.setup.steps.step4.title')"
    :description="t('views.setup.steps.step4.description')"
    :loading="isSubmitting"
    @next="handleNext"
  >
    <!-- 可变框容器 -->
    <div class="flex flex-col gap-4" v-auto-animate>
      <ModuleItem
        v-model="setupStore.isPersonalized"
        :title="t('views.setup.steps.step4.personalization.title')"
        :description="t('views.setup.steps.step4.personalization.description')"
        :tag="t('views.setup.steps.step4.personalization.tag')"
      />

      <!-- 移动端/窄屏下的预览：当 lg 以下且启用了个性化时显现 -->
      <div v-if="setupStore.isPersonalized" class="block lg:hidden mt-2">
        <PersonalizationPreview />
      </div>
    </div>
  </StepLayout>
</template>
