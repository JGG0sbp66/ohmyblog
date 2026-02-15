<!-- src/components/base/button/ButtonSecondary.vue -->
<script lang="ts" setup>
import { computed, useSlots } from "vue";

// 获取插槽实例，用于自动检测是否传入了 slot 内容
const slots = useSlots();

/* TODO: 存在的一些问题, 以及修改的期望
1. button 增加 type="button"，避免在表单中误触发 submit
2. 默认内容宽度，只有需要撑满时才加 block
3. text 改为可选渲染：无文本时不输出第二个 <span>
4. 合并零散 class：把静态样式收敛成一个常量，只保留少量动态 computed
5. 去掉重复/冲突动画类（如 transition-all 与局部 transition 混用）
6. 统一激活态与 hover 态规则，避免 isActive 里重复覆盖太多 class
7. 补充注释，明确按钮 API（variant/size/full）和默认行为
*/
const props = withDefaults(
  defineProps<{
    isActive?: boolean;
    text?: string;
    fit?: boolean;
  }>(),
  { isActive: false, text: "", fit: false },
);

/* 基础按钮样式类 - 使用 Tailwind CSS 工具类 */

/* 布局相关 */
const layoutClass = computed(
  () => `
  flex items-center justify-center  /* 弹性盒子，内容居中 */
  ${props.fit ? "w-fit" : "w-full"} min-h-full px-2 py-1.5       /* 宽度模式与间距 */
  leading-tight                     /* 紧凑行高 */
`,
);

/* 外观样式 */
const appearanceClass = `
  rounded-lg                       /* 大圆角 */
  relative overflow-hidden         /* 相对定位，隐藏溢出内容 */
  bg-transparent                   /* 透明背景 */
`;

/* ::before 伪元素 - 用于创建悬停效果层 */
const beforeClass = `
  before:content-['']              /* 必须设置content才能显示伪元素 */
  before:absolute                  /* 绝对定位覆盖按钮 */
  before:top-0 before:left-0       /* 从左上角开始 */
  before:w-full before:h-full      /* 占满整个按钮 */
  before:rounded-lg                /* 与按钮相同的圆角 */
  before:bg-bg-muted               /* 使用主题中的次要背景色 */
  before:opacity-0 before:scale-85 /* 初始状态：完全透明且缩小为85% */
`;

/* 悬停状态效果 */
const hoverClass = `
  hover:before:opacity-100         /* 悬停时伪元素完全不透明 */
  hover:before:scale-100           /* 悬停时伪元素恢复正常大小 */
`;

/* 交互反馈 */
const interactionClass = `
  text-fg                          /* 默认使用主文字颜色 */
  hover:text-fg-subtle             /* 悬停时使用主题中的图标文字颜色 */
  active:scale-85                  /* 点击时轻微缩小，提供点击反馈 */
  active:opacity-80                /* 点击时降低不透明度，提供点击反馈 */
`;

const contentClass = "relative z-10 pointer-events-none";

// 自动检测是否有默认插槽内容（通常用于图标）
const hasSlot = computed(() => !!slots.default);

// 动态计算右边距：只有当同时存在 slot 和 text 时才添加间距
const hasMr = computed(() =>
  props.text === "" && hasSlot.value ? "" : "mr-3",
);
const isActiveClass = computed(() =>
  props.isActive ? "before:opacity-100 before:scale-100 !text-fg-subtle" : "",
);
</script>

<template>
  <button
    :class="[
      layoutClass,
      appearanceClass,
      beforeClass,
      hoverClass,
      interactionClass,
      isActiveClass,
    ]"
  >
    <span v-if="hasSlot" :class="[hasMr, contentClass]">
      <slot></slot>
    </span>
    <span :class="contentClass">{{ props.text }}</span>
  </button>
</template>
