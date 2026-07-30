<!-- src/components/common/item/Stamp.vue -->
<script setup lang="ts">
/**
 * Stamp - 装饰性印章组件
 *
 * 纯视觉元素，用于 404 等页面的"盖章"效果。
 * 包含隐藏 SVG 滤镜定义（feTurbulence 墨迹质感）+ 盖章弹入动画。
 */
interface Props {
  /** 印章主文字（默认 "404"） */
  text?: string;
  /** 印章副文字（默认 "不存在"） */
  subtext?: string;
}

withDefaults(defineProps<Props>(), {
  text: "404",
  subtext: "不存在",
});
</script>

<template>
  <!-- 墨迹滤镜（隐藏 SVG 定义） -->
  <svg width="0" height="0" class="absolute">
    <filter id="inkRough" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.9"
        numOctaves="2"
        seed="7"
        result="noise"
      />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" />
    </filter>
  </svg>

  <!-- 印章色只在这里定义一次，内部图元统一用 currentColor 取；
       暗色下 multiply 会糊进背景，换成 screen 提亮并调亮印泥色 -->
  <div
    class="stamp pointer-events-none absolute top-[28px] right-[34px] h-[108px] w-[108px] select-none text-[oklch(0.55_0.22_25)] mix-blend-multiply dark:text-[oklch(0.7_0.2_25)] dark:mix-blend-screen"
    aria-hidden="true"
  >
    <svg viewBox="0 0 120 120" class="block h-full w-full">
      <circle
        cx="60"
        cy="60"
        r="52"
        stroke-width="2.5"
        class="fill-none stroke-current"
      />
      <circle
        cx="60"
        cy="60"
        r="44"
        stroke-width="1"
        class="fill-none stroke-current"
      />
      <text
        x="60"
        y="54"
        font-size="22"
        text-anchor="middle"
        class="fill-current font-serif"
      >
        {{ text }}
      </text>
      <text
        x="60"
        y="76"
        font-size="11"
        text-anchor="middle"
        letter-spacing="2"
        class="fill-current font-serif"
      >
        {{ subtext }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
/* 只留 Tailwind 表达不了的部分：
 * - @keyframes：自定义动画得注册进全局 @theme，而这是印章专用的一次性动画；
 *   且 Vue 会给 scoped 内的 keyframes 加作用域后缀，animation 必须与它同处一个块
 * - opacity/transform 是动画起始态，交给 Tailwind 会和 keyframes 抢 transform
 * - filter: url() 写成 arbitrary class 可读性归零，留在这里跟动画作为一组视觉处理 */
.stamp {
  transform: rotate(-9deg) scale(0.4);
  opacity: 0;
  animation: stamp-hit 520ms 260ms cubic-bezier(0.2, 1.4, 0.4, 1) forwards;
  filter: url(#inkRough);
}

@keyframes stamp-hit {
  0% {
    opacity: 0;
    transform: rotate(-9deg) scale(0.4);
  }
  55% {
    opacity: 0.95;
    transform: rotate(-9deg) scale(1.08);
  }
  100% {
    opacity: 0.88;
    transform: rotate(-9deg) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stamp {
    animation: none;
    opacity: 0.88;
    transform: rotate(-9deg) scale(1);
  }
}
</style>
