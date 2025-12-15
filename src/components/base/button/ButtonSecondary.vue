<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        hasSlot?: boolean;
        text?: string;
    }>(),
    {
        text: "",
        hasSlot: false,
    },
);

const ismr = computed(() => {
    if (props.text === "" && props.hasSlot) {
        return "";
    }
    return "mr-2";
});
</script>

<template>
    <button class="btn hover:text-text-icon active:scale-95">
        <span v-if="props.hasSlot" :class="ismr">
            <slot></slot>
        </span>
        <span>{{ props.text }}</span>
    </button>
</template>

<style scoped>
@reference '@/css/tailwind.css';

.btn {
    @apply flex items-center justify-center w-full h-full rounded-lg transition-all duration-200 ease-in-out relative overflow-hidden bg-transparent;
}

.btn::before {
    @apply content-[''] absolute top-0 left-0 w-full h-full rounded-lg transition-all duration-200 ease-in-out bg-bg-secondary opacity-0;
    transform: scale(0.75);
}

.btn:hover::before {
    @apply opacity-100;
    transform: scale(1);
}

.btn>* {
    @apply relative z-10;
}
</style>