<!-- src/components/theme/ToggleTheme.vue -->
<script lang="ts" setup>
import { useTheme } from '@/composables/theme.hook';
import ButtonSecondary from '../base/button/ButtonSecondary.vue';
import ThemePicker from '../icon/theme/ThemePicker.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DropButton from '../common/button/DropButton.vue';

const { t } = useI18n();
const { colorMode, cycleTheme, setTheme, THEME_MODES } = useTheme();

const themeOptions = computed(() => {
    return THEME_MODES.map((mode) => ({
        value: mode,
        label: t(`components.theme.ToggleTheme.${mode}`)
    }));
});

// 判断当前主题是否为选中主题
const isActive = (value: string) => {
    return colorMode.value === value;
};
</script>

<template>
    <DropButton placement="-left-10">
        <template #trigger="{ active }">
            <!-- 点击触发循环切换 -->
            <ButtonSecondary :hasSlot="true" :isActive="active" @click="cycleTheme()">
                <!-- 传入当前的模式名称 -->
                <ThemePicker :theme="colorMode" />
            </ButtonSecondary>
        </template>

        <template #content>
            <div v-for="option in themeOptions" :key="option.value" class="flex flex-col mt-0.5 mb-0.5">
                <ButtonSecondary @click="setTheme(option.value)" :text="option.label" class="p-2 justify-start px-3"
                    :isActive="isActive(option.value)" :hasSlot="true">
                    <ThemePicker :theme="option.value" />
                </ButtonSecondary>
            </div>
        </template>
    </DropButton>
</template>