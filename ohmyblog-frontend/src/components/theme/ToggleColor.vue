<script lang="ts" setup>
import { currentHue } from '@/composables/theme.hook';
import ButtonSecondary from '@/components/base/button/ButtonSecondary.vue';
import ColorPicker from '../icon/theme/ColorPicker.vue'
import DropButton from '../common/button/DropButton.vue';
</script>

<template>
    <DropButton :contentClass="'flex flex-col gap-4 min-w-60 p-4'">
        <template #trigger="{ active }">
            <ButtonSecondary :hasSlot="true" :isActive="active">
                <ColorPicker />
            </ButtonSecondary>
        </template>

        <template #content>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <!-- 动态指示条，跟随当前 hue 变化 -->
                    <div class="w-1 h-4 rounded-sm" :style="{ backgroundColor: `oklch(0.60 0.18 ${currentHue})` }">
                    </div>
                    <span class="text-text-main font-bold text-lg">{{ $t('components.theme.ToggleColor.paletteTitle')
                        }}</span>
                </div>
                <span
                    class="w-10 h-7 bg-bg-secondary flex items-center justify-center text-text-icon rounded-lg text-sm font-bold transition-all duration-200">{{
                        currentHue }}</span>
            </div>

            <!-- 颜色滑动条 -->
            <div class="flex flex-col gap-2 py-2">
                <input type="range" v-model.number="currentHue" min="0" max="360"
                    class="w-full h-3 rounded-full appearance-none cursor-pointer outline-none" style="background: linear-gradient(to right, 
                            oklch(0.6 0.18 0), 
                            oklch(0.6 0.18 45),
                            oklch(0.6 0.18 90),
                            oklch(0.6 0.18 135),
                            oklch(0.6 0.18 180), 
                            oklch(0.6 0.18 225),
                            oklch(0.6 0.18 270),
                            oklch(0.6 0.18 315),
                            oklch(0.6 0.18 360)
                        )" />
            </div>
        </template>
    </DropButton>
</template>

<style scoped>
/* 轨道样式 */
input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 12px;
    border-radius: 4px;
    background: linear-gradient(to right, #4f46e5, #818cf8);
    outline: none;
}

/* WebKit 滑块（竖线样式） */
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 6px;
    /* 竖线宽度 */
    height: 24px;
    /* 竖线高度 */
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
    transform: scale(1.2);
    /* 放大效果 */
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
    height: 28px;
    /* 稍微变长 */
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
