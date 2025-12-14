<script lang="ts" setup>
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        isloading?: boolean;
        text?: string;
    }>(),
    {
        isloading: false,
        text: "请输入文本",
    },
);

const isloading = computed(() => {
    return props.isloading
        ? "bg-primary-active cursor-not-allowed opacity-80"
        : "bg-primary hover:bg-primary-hover active:scale-95";
});
</script>

<template>
    <button
        :disabled="props.isloading"
        :class="[
            'w-full h-full font-bold text-white rounded-lg transition-all duration-200 flex items-center justify-center',
            isloading,
        ]"
    >
        <span v-if="props.isloading" class="mr-2">
            <slot></slot>
        </span>
        <span>{{ props.text }}</span>
    </button>
</template>
