<script lang="ts" setup>
import { currentHue } from './useTheme';
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
        <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
            <div v-if="isShow" :class="['bg-bg-card', positionClass, 'mt-6', 'p-4', 'rounded-lg', 'shadow-lg', 'flex', 'flex-col', 'gap-4', 'min-w-60']">
                <!-- 标题行 -->
                <div class="flex items-center gap-2">
                    <!-- 动态指示条，跟随当前 hue 变化 -->
                    <div class="w-1 h-4 rounded-sm transition-all duration-200"
                         :style="{ backgroundColor: `oklch(0.60 0.18 ${currentHue})` }">
                    </div>
                    <!-- TODO: 后续同步i18n -->
                    <span class="text-text-main font-bold text-lg">主题颜色</span>
                    <!-- TODO: 右侧添加输入框，输入 0-360 数值快速设置 -->
                </div>

                <!-- 颜色滑动条 -->
                <div class="flex flex-col gap-2 py-2">
                    <input 
                        type="range" 
                        v-model.number="currentHue" 
                        min="0" 
                        max="360" 
                        class="w-full h-3 rounded-full appearance-none cursor-pointer outline-none"
                        style="background: linear-gradient(to right, 
                            oklch(0.6 0.18 0), 
                            oklch(0.6 0.18 45),
                            oklch(0.6 0.18 90),
                            oklch(0.6 0.18 135),
                            oklch(0.6 0.18 180), 
                            oklch(0.6 0.18 225),
                            oklch(0.6 0.18 270),
                            oklch(0.6 0.18 315),
                            oklch(0.6 0.18 360)
                        )"
                    />
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
/* TODO: 修改样式为竖线，并添加选中的时候放大效果，另外现在边框是一团黑线，后续修改为淡淡的阴影 */
/* 自定义 range input 的滑块样式 (WebKit) */
input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid currentColor; /* 稍微带点边框 */
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    margin-top: -4px; /* 对齐轨道 */
}

/* 简单的轨道样式重置，虽然上面的 inline style 已经覆盖了背景 */
input[type=range]::-webkit-slider-runnable-track {
    width: 100%;
    height: 12px;
    cursor: pointer;
    border-radius: 999px;
}
</style>
