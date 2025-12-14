<script lang="ts" setup>
import { themeOptions, changeBrandColor } from './useTheme';
</script>

<template>
    <div class="flex gap-2">
        <button 
            v-for="item in themeOptions" 
            :key="item.name" 
            @click="changeBrandColor(item.name)"
            class="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
            :style="{ backgroundColor: `var(--color-${item.light.base})` }"
            :title="item.name"
        >
        </button>
    </div>
</template>