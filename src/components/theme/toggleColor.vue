<script lang="ts" setup>
import { themeOptions, changeBrandColor, isDark } from './useTheme';
import ButtonSecondary from '@/components/base/button/ButtonSecondary.vue';
import ColorPicker from '@/components/icon/ColorPicker.vue';
import { ref } from 'vue';
import { onClickOutside } from '@vueuse/core';

const isShow = ref(false);
const containerRef = ref(null)

const toggleShow = () => {
    isShow.value = !isShow.value;
};

onClickOutside(containerRef, () => {
    isShow.value = false;
});

const positionClass = `absolute top-full z-50`

</script>

<template>
    <div class="relative" ref="containerRef">
        <div class="w-11 h-11">
            <ButtonSecondary :hasSlot="true" :isActive="isShow" @click="toggleShow">
                <ColorPicker />
            </ButtonSecondary>
        </div>

        <!-- 画板显示区域 -->
        <!-- TODO: 1. 新增标题显示
                   2. 新增选中状态显示 -->
        <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
            <div v-if="isShow" :class="['bg-bg-card', positionClass, 'mt-6', 'p-4', 'rounded-lg', 'shadow-lg']">
                <div class="flex gap-2">
                    <button v-for="item in themeOptions" :key="item.name" @click="changeBrandColor(item.name)"
                        :class="['w-8 h-8 rounded-full shadow-sm', item.previewColor]"
                        :title="item.name">
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>