<script lang="ts" setup>
import { RiTranslate, RiEmphasisCn, RiEnglishInput } from '@remixicon/vue';
const props = defineProps<{
    language: string
}>()
</script>

<template>
    <RiTranslate v-if="props.language == 'translate'" class="text-[1.25rem] w-[1em] h-[1em]" />
    <RiEmphasisCn v-if="props.language == 'zh-CN'" class="text-[1.25rem] w-[1em] h-[1em]" />
    <RiEnglishInput v-if="props.language == 'en-US'" class="text-[1.25rem] w-[1em] h-[1em]" />
</template>