<script lang="ts" setup>
import { colorMode, cycleTheme, THEME_MODES, setTheme } from './useTheme';
import ButtonSecondary from '../base/button/ButtonSecondary.vue';
import ThemePicker from '../icon/ThemePicker.vue';
import { computed } from 'vue';
import BasePop from '../base/pop/BasePop.vue';
import { ref } from 'vue';

const isShow = ref(false);
const btnRef = ref(null);

const toggleShow = () => {
    isShow.value = !isShow.value;
};

const isActive = (value: string) => {
    return colorMode.value === value;
};

const currentThemeName = computed(() => {
    if (colorMode.value === 'auto') return 'system';
    return colorMode.value; // 'light' or 'dark'
});
</script>

<template>
    <div class="relative" ref="btnRef">
        <div class="w-11 h-11">
            <!-- 点击触发循环切换 -->
            <ButtonSecondary :hasSlot="true" @click="cycleTheme(); toggleShow();">
                <!-- 传入当前的模式名称 -->
                <ThemePicker :theme="currentThemeName" />
            </ButtonSecondary>
        </div>

        <BasePop v-model="isShow" :trigger-ref="btnRef" class="min-w-30 p-2">
            <div v-for="value in THEME_MODES" :key="value" class="flex flex-col mt-0.5 mb-0.5">
                <!-- TODO: 1. 将value映射为可读性更好的名称，并做i18n处理 -->
                <!-- TODO: 2. 添加图标，仿照fuwair的明暗主题弹窗 -->
                <ButtonSecondary @click="setTheme(value)" :text="value" class="p-2" :isActive="isActive(value)">
                </ButtonSecondary>
            </div>
        </BasePop>
    </div>
</template>