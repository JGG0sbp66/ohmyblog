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
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import type { TPersonalInfoConfigUpsertDTO } from "@server/dtos/config.dto";

const { t } = useLang();
const setupStore = useSetupStore();
const systemStore = useSystemStore();
const { isSubmitting, runStep } = useSetupStep();

// 使用 auto-animate 自动处理子元素的显示/隐藏动画
const [containerRef] = useAutoAnimate();

const handleNext = () => {
  runStep(async () => {
    const configValue: TPersonalInfoConfigUpsertDTO["configValue"] = {
      ...systemStore.personalInfo,
    };

    /**
     * 将个性化配置（如显示名称、头像、简介、Hero横幅URL）持久化到系统配置表 (config)。
     * 现在头像和简介等展示信息已完全移至配置表管理。
     */
    return upsertConfig({
      configKey: "personal_info",
      configValue,
      description: "个性化配置（头像、首页横幅、首页标题等）",
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
    <div ref="containerRef" class="flex flex-col gap-4">
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
