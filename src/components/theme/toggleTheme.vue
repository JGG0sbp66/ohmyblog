<script lang="ts" setup>
import { isDark, toggleDarkMode } from './useTheme';
import ButtonSecondary from '../base/button/ButtonSecondary.vue';
import ThemePicker from '../icon/ThemePicker.vue';
</script>

<template>
    <!-- 后面再优化svg切换 -->
    <ButtonSecondary :hasSlot="true" @click="toggleDarkMode"><ThemePicker :theme="'system'"/></ButtonSecondary>
    <button @click="toggleDarkMode()" class="p-2 border rounded">
        {{ isDark ? '🌙 关灯' : '🌞 开灯' }}
    </button>
</template>