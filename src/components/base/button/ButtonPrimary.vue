<script lang="ts" setup>
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        isLoading?: boolean;
        text?: string;
    }>(),
    {
        isLoading: false,
        text: "请输入文本",
    },
);

const isLoading = computed(() => {
    return props.isLoading
        ? "bg-primary-active cursor-not-allowed opacity-80"
        : "bg-primary hover:bg-primary-hover active:scale-95";
});
</script>

<template>
    <button :disabled="props.isLoading" :class="[
        'w-full h-full font-bold text-white rounded-lg transition-all duration-200 flex items-center justify-center',
        isLoading,
    ]">
        <span v-if="props.isLoading" class="mr-2">
            <slot></slot>
        </span>
        <span>{{ props.text }}</span>
    </button>
</template>
