<!-- src/components/base/button/ButtonSecondary.vue -->
<script lang="ts" setup>
import { computed } from "vue";

/* TODO: 存在的一些问题, 以及修改的期望
1. button 增加 type="button"，避免在表单中误触发 submit
2. 默认内容宽度，只有需要撑满时才加 block
3. 删除 hasSlot prop，改为组件内部用 useSlots() 自动判断是否有插槽
4. text 改为可选渲染：无文本时不输出第二个 <span>
5. 合并零散 class：把静态样式收敛成一个常量，只保留少量动态 computed
6. 去掉重复/冲突动画类（如 transition-all 与局部 transition 混用）
7. 统一激活态与 hover 态规则，避免 isActive 里重复覆盖太多 class
8. 补充注释，明确按钮 API（variant/size/full）和默认行为
*/
const props = withDefaults(
  defineProps<{
    hasSlot?: boolean;
    isActive?: boolean;
    text?: string;
    fit?: boolean;
  }>(),
  { hasSlot: false, isActive: false, text: "", fit: false },
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
  transition-[background-color,border-color,transform,scale,opacity] duration-200 ease-in-out  /* 避免 text color 过渡导致闪烁 */
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
  before:transition-[background-color,opacity,transform,scale] before:duration-200 before:ease-in-out  /* 伪元素过渡效果，避免颜色插值 */
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

const hasMr = computed(() =>
  props.text === "" && props.hasSlot ? "" : "mr-3",
);
const isActiveClass = computed(() =>
  props.isActive
    ? "before:opacity-100 before:scale-100 !text-fg-subtle"
    : "",
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
    <span v-if="props.hasSlot" :class="[hasMr, contentClass]">
      <slot></slot>
    </span>
    <span :class="contentClass">{{ props.text }}</span>
  </button>
</template>
