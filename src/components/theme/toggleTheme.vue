<script lang="ts" setup>
import { colorMode, cycleTheme } from './useTheme';
import ButtonSecondary from '../base/button/ButtonSecondary.vue';
import ThemePicker from '../icon/ThemePicker.vue';
import { computed } from 'vue';

const currentThemeName = computed(() => {
    if (colorMode.value === 'auto') return 'system';
    return colorMode.value; // 'light' or 'dark'
});
</script>

<template>
    <div class="w-11 h-11">
        <!-- 点击触发循环切换 -->
        <ButtonSecondary :hasSlot="true" @click="cycleTheme()">
            <!-- 传入当前的模式名称 -->
            <ThemePicker :theme="currentThemeName" />
        </ButtonSecondary>
    </div>
</template>