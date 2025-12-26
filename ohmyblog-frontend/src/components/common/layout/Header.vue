<script lang="ts" setup>
import ToggleLanguage from '@/components/theme/ToggleLanguage.vue';
import ToggleTheme from '@/components/theme/ToggleTheme.vue';
import ToggleColor from '@/components/theme/ToggleColor.vue';
import ButtonSecondary from '@/components/base/button/ButtonSecondary.vue';
const headerClass = `
/* 1. 核心尺寸与居中 */
w-full md:max-w-[1200px] md:w-[95%] mx-auto h-18

/* 2. 内部布局 */
flex items-center justify-center

/* 3. 背景与边框 */
bg-bg-card rounded-b-2xl shadow-sm

/* 4. 动画 */
transition-all duration-200 ease-in-out
`
</script>
<template>
    <header>
        <div :class="headerClass">
            <!-- 中间导航栏区域 -->
             <!-- TODO: 后续再优化 -->
             <nav class="flex items-center mr-4 space-x-2">
                <div class="h-11 w-18"><ButtonSecondary :text="'首页'"></ButtonSecondary></div>
                <ButtonSecondary :text="'归档'"></ButtonSecondary>
                <ButtonSecondary :text="'关于'"></ButtonSecondary>
             </nav>
            <!-- 右侧按钮区域 -->
            <div class="flex items-center mr-4 space-x-2">
                <ToggleColor />
                <ToggleTheme />
                <ToggleLanguage />
            </div>
        </div>
    </header>
</template>