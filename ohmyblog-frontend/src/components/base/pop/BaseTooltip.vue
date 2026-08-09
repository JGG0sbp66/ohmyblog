<!-- src/components/base/pop/BaseTooltip.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { CircleHelp } from "lucide-vue-next";

/**
 * BaseTooltip — 通用 Tooltip 组件
 *
 * 使用 Teleport to="body" 将 tooltip 渲染到根层，彻底避免被父级 overflow 容器裁切。
 * 坐标在每次 mouseenter 时即时读取 getBoundingClientRect()，
 * 避免路由动画期间 mount 导致 useElementBounding 缓存错误坐标的问题。
 *
 * 触屏一律不弹（同 DropButton / FooterDrop 的判定）：点一下会合成 mouseenter
 * 把提示弹出来，但手指抬起不会有 mouseleave，于是它**永久挂在屏幕上**，
 * 还会盖住紧接着打开的弹层。触屏本来也没有「悬停」这个交互。
 */
defineProps<{ content: string }>();

const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

const triggerRef = ref<HTMLElement>();
const isHovered = ref(false);
const tooltipStyle = ref<Record<string, string>>({});

const handleMouseEnter = () => {
  if (!canHover.value) return;
  if (triggerRef.value) {
    const { top, left, width } = triggerRef.value.getBoundingClientRect();
    tooltipStyle.value = {
      top: `${top - 8}px`,
      left: `${left + width / 2}px`,
      transform: "translate(-50%, -100%)",
    };
  }
  isHovered.value = true;
};
</script>

<template>
  <!-- 触发器 -->
  <div
    ref="triggerRef"
    class="flex items-center"
    @mouseenter="handleMouseEnter"
    @mouseleave="isHovered = false"
  >
    <slot name="trigger">
      <CircleHelp
        class="w-3.5 h-3.5 text-fg-soft cursor-help hover:text-accent transition-colors"
      />
    </slot>
  </div>

  <!-- Tooltip 内容：渲染到 body，不受任何 overflow 容器影响 -->
  <Teleport to="body">
    <Transition enter-from-class="opacity-0" leave-to-class="opacity-0">
      <div
        v-if="isHovered"
        class="fixed z-9999 w-48 pointer-events-none"
        :style="tooltipStyle"
      >
        <div
          class="bg-bg-card border border-fg-subtle/10 shadow-xl rounded-lg px-3 py-2"
        >
          <p
            class="text-[11px] leading-relaxed text-fg normal-case font-medium whitespace-pre-line"
          >
            {{ content }}
          </p>
        </div>
        <!-- 小三角（朝下，指向触发器） -->
        <div
          class="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-fg-subtle/10"
        >
          <div
            class="absolute -top-1.75 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-bg-card"
          ></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
