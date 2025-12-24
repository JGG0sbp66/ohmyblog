<script lang="ts" setup>
import { ref } from 'vue';
import { onClickOutside } from '@vueuse/core';

const props = defineProps<{
    modelValue: boolean;
    // 接收外部触发器的 ref，用于排除点击检测
    triggerRef?: HTMLElement | null;
}>();

const emit = defineEmits(['update:modelValue']);

const panelRef = ref(null);

onClickOutside(panelRef, (event) => {
    // 如果点击的是触发器，不要在这里处理（让触发器自己的 click 事件去处理）
    if (props.triggerRef && props.triggerRef.contains(event.target as Node)) {
        return;
    }

    if (props.modelValue) {
        emit('update:modelValue', false);
    }
});
</script>

<template>
    <!-- 弹窗内容容器 -->
    <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
        <div v-if="modelValue" ref="panelRef" class="bg-bg-card absolute z-50 mt-6 rounded-lg shadow-lg"
            :class="$attrs.class">
            <slot></slot>
        </div>
    </Transition>
</template>