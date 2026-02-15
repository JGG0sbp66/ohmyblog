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
import type { TPersonalInfoConfigUpsertDTO } from "@server/dtos/config.dto";

const { t } = useLang();
const setupStore = useSetupStore();
const systemStore = useSystemStore();
const { isSubmitting, runStep } = useSetupStep();

const handleNext = () => {
  runStep(async () => {
    const configValue: TPersonalInfoConfigUpsertDTO["configValue"] = {
      ...systemStore.personalInfo,
    };

    /**
     * 将个性化配置（如首页头像、Hero横幅URL）持久化到系统配置表 (config)。
     * 并且 user 表中的 avatar_url 字段已经通过 /upload/avatar 接口同步更新。
     * 此处仅负责保存全局的站点外观显示配置。
     */
    return upsertConfig({
      configKey: "personal_info",
      configValue,
      description: "个性化配置（头像、首页横幅）",
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
