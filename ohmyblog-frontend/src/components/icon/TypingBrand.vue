<!-- src/components/icon/BlogLogo.vue -->
<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useTyping } from '@/composables/typing.hook'

// 1. 定义 Props，设置默认值为空字符串
const props = withDefaults(defineProps<{
    line1?: string
    line2?: string
    line3?: string
}>(), {
    line1: '',
    line2: '',
    line3: ''
})

const { displayText: line1Text, type: type1, reset: reset1, isTyping: isTyping1 } = useTyping(50)
const { displayText: line2Text, type: type2, reset: reset2, isTyping: isTyping2 } = useTyping(50)
const { displayText: line3Text, type: type3, reset: reset3, isTyping: isTyping3 } = useTyping(50)

const animationKey = ref(0)

// 开始执行三行字的连贯动画
async function startAnimation() {
    animationKey.value++
    reset1()
    reset2()
    reset3()

    await type1(props.line1, 300)
    await type2(props.line2, 200)
    await type3(props.line3, 200)
}

// 监听内容变化，内容变了就重播动画
watch(() => [props.line1, props.line2, props.line3], () => {
    startAnimation()
})

onMounted(() => {
    startAnimation()
})
</script>

<template>
    <!-- :key="animationKey" 用于在内容变化时彻底重绘 SVG -->
    <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" class="illustration-svg" :key="animationKey"
        preserveAspectRatio="xMidYMid meet">
        <defs>
            <!-- 主色调渐变：引用主题主色 -->
            <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="var(--theme-primary)" />
                <!-- 这里的第二个点可以稍微透明一点或者使用主色 -->
                <stop offset="100%" stop-color="var(--theme-primary)" stop-opacity="0.6" />
            </linearGradient>

            <!-- 次要装饰渐变：引用文本或图标色 -->
            <linearGradient id="g2" x1="0" x2="1" y1="1" y2="0">
                <stop offset="0%" stop-color="var(--theme-text-main)" stop-opacity="0.2" />
                <stop offset="100%" stop-color="var(--theme-text-main)" stop-opacity="0.05" />
            </linearGradient>
        </defs>

        <!-- 背景装饰：引用页面背景色 -->
        <rect x="0" y="0" width="600" height="400" fill="var(--theme-bg-page)" />

        <!-- 装饰圆圈 -->
        <circle cx="520" cy="80" r="60" fill="url(#g1)" opacity="0.2" />
        <circle cx="80" cy="320" r="80" fill="url(#g2)" />

        <!-- 卡片主体 -->
        <g transform="translate(120,90)">
            <!-- 卡片背景和边框：引用卡片背景和次要背景色作为边框 -->
            <rect width="360" height="220" rx="16" fill="var(--theme-bg-card)" stroke="var(--theme-bg-secondary)"
                stroke-width="1" />

            <!-- 第一行文字：引用图标色/弱化文字色 -->
            <text x="180" y="85" font-size="18" fill="var(--theme-text-icon)" font-weight="400" text-anchor="middle">
                {{ line1Text }}<tspan class="cursor" :style="{ visibility: isTyping1 ? 'visible' : 'hidden' }" fill="var(--theme-primary)">|</tspan>
            </text>

            <!-- 第二行文字（重点）：引用主色 -->
            <text x="180" y="120" font-size="32" fill="var(--theme-primary)" font-weight="700" text-anchor="middle">
                {{ line2Text }}<tspan class="cursor" :style="{ visibility: isTyping2 ? 'visible' : 'hidden' }" fill="var(--theme-primary)">|</tspan>
            </text>

            <!-- 第三行文字：引用主文本色 -->
            <text x="180" y="155" font-size="16" fill="var(--theme-text-main)" font-weight="500" text-anchor="middle">
                {{ line3Text }}<tspan class="cursor" :style="{ visibility: isTyping3 ? 'visible' : 'hidden' }" fill="var(--theme-primary)">|</tspan>
            </text>

            <!-- 装饰小按钮：引用主色 -->
            <rect x="24" y="185" width="120" height="36" rx="8" fill="var(--theme-primary)" opacity="0.9" />
        </g>
    </svg>
</template>

<style scoped>
.illustration-svg {
    width: 100%;
    height: 100%;
}

.cursor {
    animation: blink 1s step-end infinite;
}

@keyframes blink {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0;
    }
}
</style>