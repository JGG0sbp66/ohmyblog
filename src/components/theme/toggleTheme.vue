<script lang="ts" setup>
import { isDark, toggleDarkMode } from './useTheme';
</script>

<template>
    <button @click="toggleDarkMode" class="p-2 border rounded">
        {{ isDark ? '🌙 关灯' : '🌞 开灯' }}
    </button>
</template>