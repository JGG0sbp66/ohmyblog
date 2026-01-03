<!-- src/views/setup/index.vue -->
<script setup lang="ts">
import TypingBrand from '@/components/icon/TypingBrand.vue';
import Header from '@/components/common/layout/Header.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
    <div class="min-h-screen flex flex-col bg-bg-primary">
        <!-- 顶部调试栏 -->
        <Header />

        <main class="flex-1 flex items-center justify-center p-4 md:p-8">
            <div class="w-full max-w-5xl grid grid-cols-1 gap-12 lg:grid-cols-[1fr_480px] items-center">

                <!-- 左侧：Logo 展示区 -->
                <div class="hidden lg:block w-full">
                    <TypingBrand :line1="t('components.icon.TypingBrand.line1')"
                        :line2="t('components.icon.TypingBrand.line2')"
                        :line3="t('components.icon.TypingBrand.line3')" />
                </div>

                <!-- 右侧：表单流程区 -->
                <div class="w-full">
                    <div class="w-full">

                        <!-- 表单内容空容器 -->
                        <div
                            class="w-full min-h-125 rounded-3xl border border-bg-secondary bg-bg-card shadow-sm flex items-center justify-center text-text-icon relative overflow-hidden">
                            <span>请输入文本</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>
