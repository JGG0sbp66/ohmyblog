<!-- src/components/common/item/Loading.vue -->
<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    sizeClass?: string;
    colorClass?: string;
  }>(),
  {
    sizeClass: "w-4 h-4",
    colorClass: "text-white",
  },
);
</script>

<template>
  <!--
      animate-spin: 整体匀速旋转（1s/圈），与前景圆环 1.5s 的弧长伸缩叠加成「呼吸」感。
      想调旋转快慢只能用 [animation-duration:*]：duration-* 是 transition 的时长工具类，
      对 animation 不生效。
    -->
  <svg
    :class="['animate-spin', props.sizeClass, props.colorClass]"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <!-- 背景圆环 -->
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    ></circle>

    <!-- 前景圆环-->
    <circle
      class="spinner-path opacity-75"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
    ></circle>
  </svg>
</template>

<style scoped>
@keyframes dash {
  0% {
    /* 初始：短线条 */
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }

  50% {
    /* 中间：线条变长 (约圆周长的 75%，即 63 * 0.75 ≈ 47) */
    /* 这里的 90 改为了 48，避免超过圆周长 */
    stroke-dasharray: 48, 150;
    stroke-dashoffset: -15;
  }

  100% {
    /* 结束：变回短线条 */
    stroke-dasharray: 1, 150;
    /* offset 继续移动，形成蠕动向前的效果 (约为负的圆周长) */
    stroke-dashoffset: -62;
  }
}

.spinner-path {
  animation: dash 1.5s ease-in-out infinite;
}
</style>
