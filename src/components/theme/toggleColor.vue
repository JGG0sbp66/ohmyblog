<script lang="ts" setup>
import { themeOptions, changeBrandColor, isDark } from './useTheme';
</script>

<template>
    <div class="flex gap-2">
        <button 
            v-for="item in themeOptions" 
            :key="item.name" 
            @click="changeBrandColor(item.name)"
            class="w-8 h-8 rounded-full shadow-sm"
            :style="{ backgroundColor: isDark ? item.dark.base : item.light.base }"
            :title="item.name"
        >
        </button>
    </div>
</template>