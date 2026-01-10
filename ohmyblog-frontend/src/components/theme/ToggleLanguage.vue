<script lang="ts" setup>
import ButtonSecondary from '@/components/base/button/ButtonSecondary.vue';
import LanguagePicker from '../icon/theme/LanguagePicker.vue'
import { SUPPORTED_LOCALES, setLocale, type LocaleType, useI18n } from '@/composables/lang.hook';
import DropButton from '../common/button/DropButton.vue';

const { locale } = useI18n();

// 判断当前语言是否为选中语言
const isActive = (value: string) => {
    return locale.value === value;
};

// 切换语言
const switchLanguage = (value: LocaleType) => {
    setLocale(value);
};
</script>

<template>
    <DropButton :contentClass="'min-w-32 p-2'" placement="-left-20">
        <template #trigger="{ active }">
            <ButtonSecondary :hasSlot="true" :isActive="active">
                <LanguagePicker :language="'translate'" />
            </ButtonSecondary>
        </template>

        <template #content>
            <div v-for="value in SUPPORTED_LOCALES" :key="value.label" class="flex flex-col mt-0.5 mb-0.5">
                <ButtonSecondary @click="switchLanguage(value.value)" :text="value.label" class="p-2"
                    :isActive="isActive(value.value)" :hasSlot="true">
                    <LanguagePicker :language="value.value" />
                </ButtonSecondary>
            </div>
        </template>
    </DropButton>
</template>