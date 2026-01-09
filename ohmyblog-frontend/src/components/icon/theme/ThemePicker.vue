<!-- src/components/icon/theme/ThemePicker.vue -->
<script lang="ts" setup>
import { RiContrastLine, RiSunLine, RiMoonLine } from '@remixicon/vue';
const props = defineProps<{
    theme: string
}>()
</script>

<template>
    <RiContrastLine v-if="props.theme == 'auto'" class="w-5 h-5" />
    <RiSunLine v-if="props.theme == 'light'" class="w-5 h-5" />
    <RiMoonLine v-if="props.theme == 'dark'" class="w-5 h-5" />
</template>