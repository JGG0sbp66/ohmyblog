<script lang="ts" setup>
import BasePop from '@/components/base/pop/BasePop.vue';
import { ref } from 'vue';

interface Props {
    triggerClass?: string;
    contentClass?: string;
}

const {
    triggerClass = 'w-11 h-11',
    contentClass = 'min-w-30 p-2'
} = defineProps<Props>();

const isShow = ref(false);
const btnRef = ref(null);

const showPop = () => {
    isShow.value = true;
};

const hidePop = () => {
    isShow.value = false;
};
</script>

<template>
    <div class="relative" ref="btnRef" @mouseenter="showPop" @mouseleave="hidePop">
        <div :class="triggerClass">
            <slot name="trigger" :active="isShow"></slot>
        </div>

        <!-- 桥接层：填充按钮和浮窗之间的间隙，防止鼠标移动时浮窗消失 -->
        <div v-if="isShow" class="absolute -left-5 right-0 h-6 w-36 top-11"></div>

        <BasePop v-model="isShow" :trigger-ref="btnRef" :class="contentClass">
            <slot name="content"></slot>
        </BasePop>
    </div>
</template>