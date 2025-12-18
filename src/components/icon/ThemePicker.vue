<script lang="ts" setup>
import { RiContrast2Line, RiSunLine, RiContrastLine } from '@remixicon/vue';
const props = defineProps<{
    theme: string
}>()
</script>

<template>
    <RiContrast2Line v-if="props.theme == 'system'" class="text-[1.25rem]" />
    <RiSunLine v-if="props.theme == 'light'" class="text-[1.25rem]" />
    <RiContrast2Line v-if="props.theme == 'dark'" class="text-[1.25rem]" />
</template>