<!-- src/views/setup/steps/Step1Appearance.vue -->
<script setup lang="ts">
import ButtonSecondary from '@/components/base/button/ButtonSecondary.vue';
import { useTheme } from '@/composables/theme.hook';
import { SUPPORTED_LOCALES, setLocale, useI18n } from '@/composables/lang.hook';
import LanguagePicker from '@/components/icon/theme/LanguagePicker.vue';
import ThemePicker from '@/components/icon/theme/ThemePicker.vue';
import ColorSlider from '@/components/base/slider/ColorSlider.vue';
import StepButton from '@/components/common/button/StepButton.vue';
import { useSetupStore } from '@/stores/setup.store';
import { useToast } from '@/composables/toast.hook';
import { ref } from 'vue';
import { upsertConfig } from '@/api/config.api';

const { t, locale } = useI18n();
const { currentHue, colorMode, setTheme, THEME_MODES } = useTheme();

const stepStore = useSetupStore();
const isSubmitting = ref(false);

async function handleNext() {
    try {
        isSubmitting.value = true;

        const res = await upsertConfig({
            configKey: 'appearance',
            configValue: {
                theme: colorMode.value,
                hue: currentHue.value,
                language: locale.value
            }
        });

        useToast.success(t(`api.success.config.${res!.message}`));

        stepStore.next();
    } catch (error) {
        useToast.error(t(`api.errors.${error}`));
    } finally {
        isSubmitting.value = false;
    }
}
</script>

<template>
    <div class="p-8 flex flex-col gap-8">
        <!-- 标题 -->
        <div class="flex flex-col gap-2">
            <h2 class="text-2xl font-bold text-text-main">{{ t('views.setup.steps.step1.title') }}</h2>
            <p class="text-text-icon text-sm">{{ t('views.setup.steps.step1.description') }}</p>
        </div>

        <!-- 1. 语言选择 -->
        <div class="flex flex-col gap-3 text-text-icon">
            <label class="text-sm font-bold uppercase tracking-wider">
                {{ t('views.setup.steps.step1.language') }}
            </label>
            <div class="grid grid-cols-2 gap-3">
                <ButtonSecondary v-for="lang in SUPPORTED_LOCALES" :key="lang.value" :isActive="locale === lang.value"
                    :hasSlot="true" class="justify-center py-3" @click="setLocale(lang.value)">
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
                {{ t('views.setup.steps.step1.theme') }}
            </label>
            <div class="grid grid-cols-3 gap-3">
                <ButtonSecondary v-for="mode in THEME_MODES" :key="mode" :isActive="colorMode === mode" :hasSlot="true"
                    class="justify-center py-3" @click="setTheme(mode)">
                    <div class="flex items-center gap-2">
                        <ThemePicker :theme="mode" />
                        <span class="capitalize">{{ t(`components.theme.ToggleTheme.${mode}`) }}</span>
                    </div>
                </ButtonSecondary>
            </div>
        </div>

        <!-- 3. 主题色 (滑动条) -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <label class="text-sm font-bold text-text-icon uppercase tracking-wider">
                    {{ t('views.setup.steps.step1.color') }}
                </label>
                <!-- 当前颜色预览小块 -->
                <div class="flex items-center gap-2 bg-bg-secondary px-2 py-1 rounded-md">
                    <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: `oklch(0.60 0.18 ${currentHue})` }">
                    </div>
                    <span class="text-xs text-text-main">{{ currentHue }}</span>
                </div>
            </div>

            <div class="h-12 bg-bg-secondary rounded-xl flex items-center px-4">
                <ColorSlider v-model="currentHue" />
            </div>
        </div>

        <!-- 按钮区域 -->
        <StepButton :showPrev="false" :loading="isSubmitting" @next="handleNext" />
    </div>
</template>
