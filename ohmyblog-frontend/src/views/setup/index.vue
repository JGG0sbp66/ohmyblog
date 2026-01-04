<!-- src/views/setup/index.vue -->
<script setup lang="ts">
import TypingBrand from '@/components/icon/TypingBrand.vue';
import Header from '@/components/common/layout/Header.vue';
import Footer from '@/components/common/layout/Footer.vue';
import BaseProgress from '@/components/base/progress/BaseProgress.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
    <div v-if="true" class="min-h-screen flex flex-col bg-bg-primary">
        <!-- 顶部调试栏 -->
        <Header />

        <!-- 包裹区域 -->
        <main class="flex-1 flex items-center justify-center p-4 md:p-8">

            <div class="w-full max-w-122 lg:max-w-5xl flex flex-col gap-8">
                <!-- 进度条区域 -->
                <!-- TODO: 后续改为真实进度 -->
                <BaseProgress :currentStep="1" :totalSteps="5" :title="'我是进度条title'" />

                <!-- 初始化区域 -->
                <div class="w-full gap-12 max-w-5xl flex items-center justify-center">

                    <!-- 左侧：Logo 展示区 -->
                    <div class="hidden lg:block w-full">
                        <TypingBrand :line1="t('components.icon.TypingBrand.line1')"
                            :line2="t('components.icon.TypingBrand.line2')"
                            :line3="t('components.icon.TypingBrand.line3')" />
                    </div>

                    <!-- 右侧：表单流程区 -->
                    <div class="w-full max-w-122 bg-bg-card text-text-icon rounded-3xl">
                        <div class="p-4 h-125 block">请输入文本</div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 底部版权信息 -->
        <Footer />
    </div>
</template>
