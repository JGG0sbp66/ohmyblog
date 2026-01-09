<!-- src/components/icon/theme/LanguagePicker.vue -->
<script lang="ts" setup>
import { RiEmphasisCn, RiEnglishInput } from '@remixicon/vue';
const props = defineProps<{
    language: string
}>()
</script>

<template>
     <RiTranslate v-if="props.language == 'translate'" class="w-5 h-5" />
    <RiEmphasisCn v-if="props.language == 'zh-CN'" class="w-5 h-5" />
    <RiEnglishInput v-if="props.language == 'en-US'" class="w-5 h-5" />
</template>