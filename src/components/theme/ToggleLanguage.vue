<script lang="ts" setup>
import ButtonSecondary from '@/components/base/button/ButtonSecondary.vue';
import LanguagePicker from '../icon/theme/LanguagePicker.vue'
import BasePop from '../base/pop/BasePop.vue';
import { ref } from 'vue';
import i18n,{ SUPPORTED_LOCALES, setLocale, type LocaleType } from '@/locales/useLang';

const isShow = ref(false);
const btnRef = ref(null);

const toggleShow = () => {
    isShow.value = !isShow.value;
};

// 判断当前语言是否为选中语言
const isActive = (value: string) => {
    return i18n.global.locale.value === value;
};

// 切换语言
const switchLanguage = (value: LocaleType) => {
    setLocale(value);
};
</script>

<template>
    <!-- TODO: 添加语言的图标，然后语言可以向左对齐，仿照fuwair的明暗主题弹窗 -->
    <div class="relative" ref="btnRef">
        <div class="w-11 h-11">
            <ButtonSecondary :hasSlot="true" :isActive="isShow" @click="toggleShow">
                <LanguagePicker :language="'translate'"/>
            </ButtonSecondary>
        </div>
        <BasePop v-model="isShow" :trigger-ref="btnRef" class="min-w-32 p-2">
            <div v-for="value in SUPPORTED_LOCALES" :key="value.label" class="flex flex-col mt-0.5 mb-0.5">
                <ButtonSecondary @click="switchLanguage(value.value)" :text="value.label" class="p-2" :isActive="isActive(value.value)" :hasSlot="true">
                    <LanguagePicker :language="value.value"/>
                </ButtonSecondary>
            </div>
        </BasePop>
    </div>
</template>