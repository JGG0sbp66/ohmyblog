<!-- src/views/setup/steps/Step1Appearance.vue -->
<script setup lang="ts">
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useTheme } from "@/composables/theme.hook";
import { useLang } from "@/composables/lang.hook";
import LanguagePicker from "@/components/icon/theme/LanguagePicker.vue";
import ThemePicker from "@/components/icon/theme/ThemePicker.vue";
import ColorSlider from "@/components/base/slider/ColorSlider.vue";
import StepLayout from "../components/StepLayout.vue";
import { useSetupStep } from "@/composables/setup-step.hook";
import { upsertConfig } from "@/api/config.api";

const { t, locale, setLocale, SUPPORTED_LOCALES } = useLang();
const { currentHue, colorMode, setTheme, THEME_MODES } = useTheme();

const { isSubmitting, runStep } = useSetupStep();

const handleNext = () =>
  runStep(() =>
    upsertConfig({
      configKey: "appearance",
      configValue: {
        theme: colorMode.value,
        hue: currentHue.value,
        language: locale.value,
      },
    }),
  );
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
    <div class="flex flex-col gap-3 text-text-icon">
      <label class="text-sm font-bold uppercase tracking-wider">
        {{ t("views.setup.steps.step1.settings.language") }}
      </label>
      <div class="grid grid-cols-2 gap-3">
        <ButtonSecondary
          v-for="lang in SUPPORTED_LOCALES"
          :key="lang.value"
          :isActive="locale === lang.value"
          :hasSlot="true"
          class="justify-center py-3"
          @click="setLocale(lang.value)"
        >
          <div class="flex items-center gap-2">
            <LanguagePicker :language="lang.value" />
            <span>{{ lang.label }}</span>
          </div>
        </ButtonSecondary>
      </div>
    </div>

    <!-- 2. 主题模式 (明/暗) -->
    <div class="flex flex-col gap-3">
      <label class="text-sm font-bold text-text-icon uppercase tracking-wider">
        {{ t("views.setup.steps.step1.settings.theme") }}
      </label>
      <div class="grid grid-cols-3 gap-3">
        <ButtonSecondary
          v-for="mode in THEME_MODES"
          :key="mode"
          :isActive="colorMode === mode"
          :hasSlot="true"
          class="justify-center py-3"
          @click="setTheme(mode)"
        >
          <div class="flex items-center gap-2">
            <ThemePicker :theme="mode" />
            <span class="capitalize">{{
              t(`components.theme.ToggleTheme.${mode}`)
            }}</span>
          </div>
        </ButtonSecondary>
      </div>
    </div>

    <!-- 3. 主题色 (滑动条) -->
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <label
          class="text-sm font-bold text-text-icon uppercase tracking-wider"
        >
          {{ t("views.setup.steps.step1.settings.color") }}
        </label>
        <!-- 当前颜色预览小块 -->
        <div
          class="flex items-center gap-2 bg-bg-secondary px-2 py-1 rounded-md"
        >
          <div
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: `oklch(0.60 0.18 ${currentHue})` }"
          ></div>
          <span class="text-xs text-text-main">{{ currentHue }}</span>
        </div>
      </div>

      <div class="h-12 bg-bg-secondary rounded-xl flex items-center px-4">
        <ColorSlider v-model="currentHue" />
      </div>
    </div>
  </StepLayout>
</template>
