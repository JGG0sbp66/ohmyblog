<!-- src/components/base/button/ButtonPrimary.vue -->
<script lang="ts" setup>
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        loading?: boolean;
        disabled?: boolean;
        text?: string;
    }>(),
    {
        loading: false,
        disabled: false,
        text: "请输入文本",
    },
);

/**
 * 按钮动态样式计算属性
 * 根据组件的状态（如加载状态）返回对应的CSS类名
 */
const btnClass = computed(() => {
    // 基础样式 - 所有状态下都应用的公共样式
    const base = `
        flex items-center justify-center  /* 弹性布局，水平和垂直居中 */
        w-full h-full                     /* 占满父容器宽度和高度 */
        font-bold text-white              /* 粗体字，白色文字 */
        rounded-lg                        /* 大圆角 */
        transition-all duration-200       /* 所有属性200ms过渡动画 */
    `;

    // 状态样式 - 根据当前状态动态变化的样式
    const state = props.disabled || props.loading
        // 加载或者禁用状态样式
        ? `
            bg-primary-active              /* 使用激活状态的主色调 */
            cursor-not-allowed             /* 禁用光标，表示不可点击 */
            opacity-80                     /* 80%透明度，视觉上表示禁用 */
        `
        // 正常交互状态样式
        : `
            bg-primary                     /* 使用主色调背景 */
            hover:bg-primary-hover         /* 悬停时使用主色调的悬停变体 */
            active:scale-95                /* 点击时轻微缩小(95%)，提供触觉反馈 */
        `;

    // 合并基础样式和状态样式
    return `${base} ${state}`;
});
</script>

<template>
    <button :disabled="props.disabled" :class="btnClass">

        <!-- Loading 图标插槽 -->
        <span v-if="props.loading" class="mr-2">
            <slot></slot>
        </span>

        <span>{{ props.text }}</span>
    </button>
</template>