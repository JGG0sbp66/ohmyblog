<!-- src/views/setup/steps/Step1Appearance.vue -->
<script setup lang="ts">
import StepLayout from "../components/StepLayout.vue";
import LanguageSelector from "../components/theme/LanguageSelector.vue";
import ThemeModeSelector from "../components/theme/ThemeModeSelector.vue";
import ThemeColorPicker from "../components/theme/ThemeColorPicker.vue";
import { useTheme } from "@/composables/theme.hook";
import { useLang } from "@/composables/lang.hook";
import { useSetupStep } from "@/composables/setup-step.hook";
import { upsertConfig } from "@/api/config.api";
import type { TAppearanceConfigUpsertDTO } from "@server/dtos/config.dto";

const { t, locale } = useLang();
const { currentHue, colorMode } = useTheme();

const { isSubmitting, runStep } = useSetupStep();

const handleNext = () => {
  runStep(async () => {
    const configValue: TAppearanceConfigUpsertDTO["configValue"] = {
      theme: colorMode.value,
      hue: currentHue.value,
      language: locale.value,
    };

    return upsertConfig({
      configKey: "appearance",
      configValue,
      description: "外观设置（主题颜色、色相、语言）",
    });
  });
};
</script>

<template>
  <StepLayout
    :title="t('views.setup.steps.step1.title')"
    :description="t('views.setup.steps.step1.description')"
    :showPrev="false"
    :loading="isSubmitting"
    @next="handleNext"
  >
    <!-- 1. 语言选择 -->
    <div class="flex flex-col gap-3 text-fg-subtle animate-fade-in">
      <label class="text-sm font-bold uppercase tracking-wider">
        {{ t("views.setup.steps.step1.settings.language") }}
      </label>
      <LanguageSelector />
    </div>

    <!-- 2. 主题模式 (明/暗) -->
    <div class="flex flex-col gap-3 animate-fade-in animate-delay-50">
      <label class="text-sm font-bold text-fg-subtle uppercase tracking-wider">
        {{ t("views.setup.steps.step1.settings.theme") }}
      </label>
      <ThemeModeSelector />
    </div>

    <!-- 3. 主题色 (滑动条) -->
    <div class="flex flex-col gap-3 animate-fade-in animate-delay-100">
      <div class="flex items-center justify-between">
        <label
          class="text-sm font-bold text-fg-subtle uppercase tracking-wider"
        >
          {{ t("views.setup.steps.step1.settings.color") }}
        </label>
        <!-- 当前颜色预览小块 -->
        <div class="flex items-center gap-2 bg-bg-muted px-2 py-1 rounded-md">
          <div
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: `oklch(0.60 0.18 ${currentHue})` }"
          ></div>
          <span class="text-xs text-fg">{{ currentHue }}</span>
        </div>
      </div>

      <ThemeColorPicker />
    </div>
  </StepLayout>
</template>
