<script lang="ts" setup>
import { RiContrastLine, RiSunLine, RiMoonLine } from '@remixicon/vue';
const props = defineProps<{
    theme: string
}>()
</script>

<template>
    <RiContrastLine v-if="props.theme == 'auto'" class="text-[1.25rem] w-[1em] h-[1em]" />
    <RiSunLine v-if="props.theme == 'light'" class="text-[1.25rem] w-[1em] h-[1em]" />
    <RiMoonLine v-if="props.theme == 'dark'" class="text-[1.25rem] w-[1em] h-[1em]" />
</template>