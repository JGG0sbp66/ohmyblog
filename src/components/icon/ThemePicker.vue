<script lang="ts" setup>
import { RiContrastLine, RiSunLine, RiMoonLine } from '@remixicon/vue';
const props = defineProps<{
    theme: string
}>()
</script>

<template>
    <RiContrastLine v-if="props.theme == 'system'" class="text-[1.25rem]" />
    <RiSunLine v-if="props.theme == 'light'" class="text-[1.25rem]" />
    <RiMoonLine v-if="props.theme == 'dark'" class="text-[1.25rem]" />
</template>