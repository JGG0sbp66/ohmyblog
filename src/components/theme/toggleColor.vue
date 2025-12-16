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
/* 轨道样式 */
input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 12px;
    border-radius: 999px;
    background: linear-gradient(to right, #4f46e5, #818cf8);
    outline: none;
}

/* WebKit 滑块（竖线样式） */
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 6px;      /* 竖线宽度 */
    height: 24px;    /* 竖线高度 */
    border-radius: 2px;
    background: #ffffff;
    border: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: all 0.2s ease;
}

/* 滑块悬停/选中状态 */
input[type="range"]::-webkit-slider-thumb:hover,
input[type="range"]:active::-webkit-slider-thumb {
    transform: scale(1.2);              /* 放大效果 */
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
    height: 28px;                       /* 稍微变长 */
}

/* Firefox 兼容 */
input[type="range"]::-moz-range-thumb {
    width: 6px;
    height: 24px;
    border-radius: 2px;
    background: #ffffff;
    border: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: all 0.2s ease;
}

input[type="range"]::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
}
</style>
