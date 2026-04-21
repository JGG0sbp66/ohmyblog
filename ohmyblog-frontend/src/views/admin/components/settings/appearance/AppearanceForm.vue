<!-- src/views/admin/components/settings/AppearanceForm.vue -->
<script setup lang="ts">
import { ref } from "vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BaseTooltip from "@/components/base/pop/BaseTooltip.vue";
import LanguagePicker from "@/components/icon/theme/LanguagePicker.vue";
import ThemePicker from "@/components/icon/theme/ThemePicker.vue";
import ColorSlider from "@/components/base/slider/ColorSlider.vue";
import { useTheme } from "@/composables/theme.hook";
import { useLang } from "@/composables/lang.hook";
import { upsertConfig } from "@/api/config.api";
import { useToast } from "@/composables/toast.hook";
import type { TAppearanceConfigUpsertDTO } from "@server/dtos/config.dto";

const { t, locale, setLocale, SUPPORTED_LOCALES } = useLang();
const { currentHue, colorMode, setTheme, THEME_MODES } = useTheme();

const isSubmitting = ref(false);

const handleSave = async () => {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;
    const configValue: TAppearanceConfigUpsertDTO["configValue"] = {
      theme: colorMode.value,
      hue: currentHue.value,
      language: locale.value,
    };

    const res = await upsertConfig({
      configKey: "appearance",
      configValue,
      description: "外观设置（主题颜色、色相、语言）",
    });
    
    // 使用接口返回的 message 作为 Key 解析
    if (res?.message) {
      useToast.success(t(`api.success.config.${res.message}`));
    }
  } catch (error: any) {
    // 捕获 API 错误并翻译
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="w-full lg:w-120 bg-bg-card rounded-3xl shadow-xl p-8 flex flex-col gap-8 h-fit">
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-bold text-fg">
        {{ t("views.admin.Settings.appearance.title") }}
      </h2>
      <p class="text-fg-subtle text-sm">
        {{ t("views.admin.Settings.appearance.description") }}
      </p>
    </div>

    <!-- 1. 语言选择 -->
    <div class="flex flex-col gap-3 text-fg-subtle">
      <div class="flex items-center gap-2">
        <label class="text-sm font-bold uppercase tracking-wider">
          {{ t("views.admin.Settings.appearance.settings.language") }}
        </label>
        <BaseTooltip
          :content="t('views.admin.Settings.appearance.settings.languageHint')"
        />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <ButtonSecondary
          v-for="lang in SUPPORTED_LOCALES"
          :key="lang.value"
          :isActive="locale === lang.value"
          class="w-full justify-center py-3"
          @click="setLocale(lang.value)"
        >
          <div class="flex items-center gap-2">
            <LanguagePicker :language="lang.value" />
            <span>{{ lang.label }}</span>
          </div>
        </ButtonSecondary>
      </div>
    </div>

    <!-- 2. 主题模式 -->
    <div class="flex flex-col gap-3">
      <label class="text-sm font-bold text-fg-subtle uppercase tracking-wider">
        {{ t("views.admin.Settings.appearance.settings.theme") }}
      </label>
      <div class="grid grid-cols-3 gap-3">
        <ButtonSecondary
          v-for="mode in THEME_MODES"
          :key="mode"
          :isActive="colorMode === mode"
          class="w-full justify-center py-3"
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

    <!-- 3. 主题色 -->
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <label class="text-sm font-bold text-fg-subtle uppercase tracking-wider">
          {{ t("views.admin.Settings.appearance.settings.color") }}
        </label>
        <div class="flex items-center gap-2 bg-bg-muted px-2 py-1 rounded-md">
          <div
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: `oklch(0.60 0.18 ${currentHue})` }"
          ></div>
          <span class="text-xs text-fg">{{ currentHue }}</span>
        </div>
      </div>

      <div class="h-12 bg-bg-muted rounded-xl flex items-center px-4">
        <ColorSlider v-model="currentHue" />
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="pt-4 mt-auto">
      <ButtonPrimary
        class="w-full rounded-2xl text-base font-bold"
        :loading="isSubmitting"
        @click="handleSave"
        :text="t('views.admin.Settings.appearance.save')"
      />
    </div>
  </div>
</template>
