<script lang="ts" setup>
import { RiContrast2Line, RiSunLine } from '@remixicon/vue';
const props = defineProps<{
    theme: string
}>()
</script>

<template>
    <RiSunLine v-if="props.theme == 'light'" class="text-[1.25rem]" />
    <RiContrast2Line v-if="props.theme == 'dark'" class="text-[1.25rem]" />
</template>