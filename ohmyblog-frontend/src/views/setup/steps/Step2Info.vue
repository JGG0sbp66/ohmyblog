<!-- src/views/setup/steps/Step2Info.vue -->
<script setup lang="ts">
import { ref } from "vue";
import TipInput from "@/components/common/input/TipInput.vue";
import FaviconUpload from "@/components/common/upload/FaviconUpload.vue";
import StepLayout from "../components/StepLayout.vue";
import { useLang } from "@/composables/lang.hook";
import { useSetupStep, type Validatable } from "@/composables/setup-step.hook";
import { upsertConfig } from "@/api/config.api";
import { useSystemStore } from "@/stores/system.store";
import {
  SiteInfoConfigUpsertDTO,
  type TSiteInfoConfigUpsertDTO,
} from "@server/dtos/config.dto";

const { t } = useLang();
const { isSubmitting, runStep } = useSetupStep();
const systemStore = useSystemStore();

const titleInputRef = ref<Validatable | null>(null);
const footerInputRef = ref<Validatable | null>(null);
const icpInputRef = ref<Validatable | null>(null);

const handleNext = () => {
  runStep(
    async () => {
      const configValue: TSiteInfoConfigUpsertDTO["configValue"] = {
        ...systemStore.siteInfo,
      };

      return upsertConfig({
        configKey: "site_info",
        configValue,
        description: "站点基本信息（标题、图标、页脚、备案号）",
      });
    },
    {
      validate: [titleInputRef.value, footerInputRef.value, icpInputRef.value],
    },
  );
};
</script>

<template>
  <StepLayout
    :title="t('views.setup.steps.step2.title')"
    :description="t('views.setup.steps.step2.description')"
    :loading="isSubmitting"
    @next="handleNext"
  >
    <!-- 站点名称 -->
    <div class="onload-animation">
      <TipInput
        ref="titleInputRef"
        v-model="systemStore.siteInfo.title"
        :label="t('views.setup.steps.step2.siteTitle.label')"
        :placeholder="t('views.setup.steps.step2.siteTitle.placeholder')"
        :hint="t('views.setup.steps.step2.siteTitle.hint')"
        :schema="
          SiteInfoConfigUpsertDTO.properties.configValue.properties.title
        "
        required
      />
    </div>

    <!-- 页脚版权 -->
    <div class="onload-animation anim-delay-50">
      <TipInput
        ref="footerInputRef"
        v-model="systemStore.siteInfo.footer"
        :label="t('views.setup.steps.step2.footer.label')"
        :placeholder="t('views.setup.steps.step2.footer.placeholder')"
        :hint="t('views.setup.steps.step2.footer.hint')"
        :schema="
          SiteInfoConfigUpsertDTO.properties.configValue.properties.footer
        "
      />
    </div>

    <!-- 备案号 -->
    <div class="onload-animation anim-delay-100">
      <TipInput
        ref="icpInputRef"
        v-model="systemStore.siteInfo.icp"
        :label="t('views.setup.steps.step2.icp.label')"
        :placeholder="t('views.setup.steps.step2.icp.placeholder')"
        :hint="t('views.setup.steps.step2.icp.hint')"
        :schema="SiteInfoConfigUpsertDTO.properties.configValue.properties.icp"
      />
    </div>

    <!-- 站点图标上传 -->
    <div class="onload-animation anim-delay-150">
      <FaviconUpload v-model="systemStore.siteInfo.favicon" />
    </div>
  </StepLayout>
</template>
