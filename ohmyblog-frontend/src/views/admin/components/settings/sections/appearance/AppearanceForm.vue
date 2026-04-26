<!-- src/views/admin/components/settings/AppearanceForm.vue -->
<script setup lang="ts">
import { ref } from "vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BaseTooltip from "@/components/base/pop/BaseTooltip.vue";
import LanguageSelector from "@/views/setup/components/theme/LanguageSelector.vue";
import ThemeModeSelector from "@/views/setup/components/theme/ThemeModeSelector.vue";
import ThemeColorPicker from "@/views/setup/components/theme/ThemeColorPicker.vue";
import { useTheme } from "@/composables/theme.hook";
import { useLang } from "@/composables/lang.hook";
import { upsertConfig } from "@/api/config.api";
import { useToast } from "@/composables/toast.hook";
import type { TAppearanceConfigUpsertDTO } from "@server/dtos/config.dto";

const { t, locale } = useLang();
const { currentHue, colorMode } = useTheme();

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
  <SettingCard
    :title="t('views.setup.steps.step1.title')"
    :description="t('views.setup.steps.step1.description')"
    class="w-full lg:w-120 h-fit"
  >
    <!-- 1. 语言选择 -->
    <div class="flex flex-col gap-3 text-fg-subtle">
      <div class="flex items-center gap-2">
        <label class="text-sm font-bold uppercase tracking-wider">
          {{ t("views.setup.steps.step1.settings.language") }}
        </label>
        <BaseTooltip
          :content="t('views.admin.Settings.appearance.settings.languageHint')"
        />
      </div>
      <LanguageSelector />
    </div>

    <!-- 2. 主题模式 -->
    <div class="flex flex-col gap-3">
      <label class="text-sm font-bold text-fg-subtle uppercase tracking-wider">
        {{ t("views.setup.steps.step1.settings.theme") }}
      </label>
      <ThemeModeSelector />
    </div>

    <!-- 3. 主题色 -->
    <ThemeColorPicker>
      <template #label>
        <label
          class="text-sm font-bold text-fg-subtle uppercase tracking-wider"
        >
          {{ t("views.setup.steps.step1.settings.color") }}
        </label>
      </template>
    </ThemeColorPicker>

    <!-- 保存按钮 -->
    <template #footer>
      <div class="flex justify-end pt-4">
        <ButtonPrimary
          class="min-w-32"
          :loading="isSubmitting"
          @click="handleSave"
          :text="t('common.save')"
        />
      </div>
    </template>
  </SettingCard>
</template>
