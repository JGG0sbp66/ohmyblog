<script lang="ts" setup>
import { isDark, toggleDarkMode } from './useTheme';
import ButtonSecondary from '../base/button/ButtonSecondary.vue';
import ThemePicker from '../icon/ThemePicker.vue';
</script>

<template>
    <!-- TODO: 后续新增system主题支持 -->
    <div class="w-11 h-11">
        <ButtonSecondary :hasSlot="true" @click="toggleDarkMode()">
            <ThemePicker :theme="isDark ? 'dark' : 'light'" />
        </ButtonSecondary>
    </div>
</template>