<!-- src/components/base/button/ButtonThird.vue -->
<script lang="ts" setup>
import { computed, useSlots } from "vue";
import { RouterLink, type RouteLocationRaw } from "vue-router";

/**
 * ButtonThird - 第三级按钮（纯文本样式）
 *
 * 与 ButtonPrimary（主操作）/ ButtonSecondary（次操作）相区别，
 * 用于轻量、辅助性的文字操作（如页脚链接、「忘记密码」「重新发送」等）。
 *
 * 视觉上仅有文本 + 悬浮变亮，hover 和选中态附加底部下划线动画（从左向右展开）。
 * 根据传入的 href 或 to 自动渲染为外链 <a> 或站内 RouterLink。
 *
 * Props:
 * - text: 按钮文本
 * - disabled: 是否禁用
 * - isActive: 是否处于选中/激活状态（显示底部下划线 + 高亮文色）
 * - href: 外链地址；传入时渲染为 <a>
 * - to: 站内路由地址；传入时渲染为 RouterLink，优先级高于 href
 * - target / rel: 外链 <a> 的原生属性
 * 插槽：
 * - default: 文本前的可选图标
 * - suffix: 文本后的可选尾部内容（如箭头图标）
 */
const props = withDefaults(
  defineProps<{
    text?: string;
    disabled?: boolean;
    isActive?: boolean;
    href?: string;
    to?: RouteLocationRaw;
    target?: string;
    rel?: string;
  }>(),
  {
    text: "",
    disabled: false,
    isActive: false,
    href: undefined,
    to: undefined,
    target: undefined,
    rel: undefined,
  },
);

const slots = useSlots();
const hasSuffix = computed(() => !!slots.suffix);

const componentTag = computed(() => {
  if (props.to) return RouterLink;
  if (props.href) return "a";
  return "button";
});

const componentProps = computed(() => {
  if (props.to) return { to: props.to };
  if (props.href) {
    return {
      href: props.href,
      target: props.target,
      rel: props.rel,
    };
  }
  return {
    type: "button",
    disabled: props.disabled,
  };
});
</script>

<template>
  <component
    :is="componentTag"
    v-bind="componentProps"
    :aria-disabled="disabled || undefined"
    class="btn-third group/third inline-flex items-center gap-1 bg-transparent border-none px-1 py-0.5 transition-colors duration-200 relative"
    :class="[
      disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
      isActive ? 'text-fg' : 'text-fg-muted hover:text-fg',
    ]"
  >
    <slot />
    <span v-if="text">{{ text }}</span>
    <span v-if="hasSuffix" class="inline-flex items-center">
      <slot name="suffix" />
    </span>

    <!-- 底部下划线：从左向右展开动画 -->
    <span
      class="absolute bottom-0 left-1 h-px bg-current opacity-30 transition-[width] duration-300 ease-out"
      :class="[
        isActive
          ? 'w-[calc(100%-0.5rem)]'
          : 'w-0 group-hover/third:w-[calc(100%-0.5rem)]',
      ]"
    />
  </component>
</template>
