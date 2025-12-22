<script lang="ts" setup>
import { colorMode, cycleTheme, THEME_MODES, setTheme } from './useTheme';
import ButtonSecondary from '../base/button/ButtonSecondary.vue';
import ThemePicker from '../icon/theme/ThemePicker.vue';
import BasePop from '../base/pop/BasePop.vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n(); 

const themeOptions = computed(() => {
  return THEME_MODES.map((mode) => ({
    value: mode,
    label: t(`components.theme.ToggleTheme.${mode}`) 
  }));
});

const isShow = ref(false);
const btnRef = ref(null);

const showPop = () => {
    isShow.value = true;
};

const hidePop = () => {
    isShow.value = false;
};

const isActive = (value: string) => {
    return colorMode.value === value;
};
</script>

<template>
    <div class="relative" ref="btnRef" @mouseenter="showPop" @mouseleave="hidePop">
        <div class="w-11 h-11">
            <!-- 点击触发循环切换 -->
            <ButtonSecondary :hasSlot="true" @click="cycleTheme()">
                <!-- 传入当前的模式名称 -->
                <ThemePicker :theme="colorMode" />
            </ButtonSecondary>
        </div>

        <!-- 桥接层：填充按钮和浮窗之间的间隙，防止鼠标移动时浮窗消失 -->
        <div v-if="isShow" class="absolute -left-5 right-0 h-6 w-36 top-11"></div>

        <BasePop v-model="isShow" :trigger-ref="btnRef" class="min-w-30 p-2">
            <div v-for="option in themeOptions" :key="option.value" class="flex flex-col mt-0.5 mb-0.5">
                <!-- TODO: 学习图标和文字之间的排布与空间位置，目前看起来还是有点奇怪（感觉整体有点靠左），后续再优化 -->
                <ButtonSecondary @click="setTheme(option.value)" :text="option.label" class="p-2 justify-start px-3" :isActive="isActive(option.value)" :hasSlot="true">
                    <ThemePicker :theme="option.value" />
                </ButtonSecondary>
            </div>
        </BasePop>
    </div>
</template>