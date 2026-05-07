<!-- src/views/admin/components/posts/editor/content/menus/bubble/BubbleColorButton.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import type { Editor } from "@tiptap/core";
import { Type } from "lucide-vue-next";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import BasePop from "@/components/base/pop/BasePop.vue";

/**
 * BubbleColorButton — 字体颜色 & 背景高亮选色器
 *
 * 复用 BasePop + IconTipButton，模式与 BubbleLinkButton 一致。
 * - 上半区：预设字体颜色（Color 扩展）
 * - 下半区：预设背景高亮色（Highlight 扩展，multicolor）
 */
const props = defineProps<{ editor: Editor }>();

const isOpen = ref(false);
const btnRef = ref<HTMLElement | null>(null);

/**
 * 字体颜色预设 — Tailwind 600 级，饱和度统一，深浅背景均可辨识
 */
const textColors = [
  { label: "默认", value: null },
  { label: "灰色", value: "#6B7280" },
  { label: "棕色", value: "#92400E" },
  { label: "橙色", value: "#EA580C" },
  { label: "黄色", value: "#D97706" },
  { label: "绿色", value: "#16A34A" },
  { label: "蓝色", value: "#2563EB" },
  { label: "紫色", value: "#7C3AED" },
  { label: "粉色", value: "#DB2777" },
  { label: "红色", value: "#DC2626" },
];

/**
 * 背景高亮颜色预设 — rgba 直接复用文字色 RGB，色相天然对齐
 * 透明度 0.12 ~ 0.14（600 级饱和度高，浓度低也足够辨识）
 */
const bgColors = [
  { label: "无",   value: null },
  { label: "灰色", value: "rgba(107,114,128,0.14)" },
  { label: "棕色", value: "rgba(146,64,14,0.12)"   },
  { label: "橙色", value: "rgba(234,88,12,0.12)"   },
  { label: "黄色", value: "rgba(217,119,6,0.14)"   },
  { label: "绿色", value: "rgba(22,163,74,0.12)"   },
  { label: "蓝色", value: "rgba(37,99,235,0.12)"   },
  { label: "紫色", value: "rgba(124,58,237,0.12)"  },
  { label: "粉色", value: "rgba(219,39,119,0.12)"  },
  { label: "红色", value: "rgba(220,38,38,0.12)"   },
];

const currentTextColor = computed(
  () => props.editor.getAttributes("textStyle").color ?? null,
);
const currentBgColor = computed(
  () => props.editor.getAttributes("highlight").color ?? null,
);
const hasAnyColor = computed(
  () => currentTextColor.value !== null || currentBgColor.value !== null,
);

/** 按钮底部小色条：显示当前字体颜色（无则用 currentColor） */
const indicatorColor = computed(
  () => currentTextColor.value ?? "currentColor",
);

const setTextColor = (color: string | null) => {
  if (color === null) {
    props.editor.chain().focus().unsetColor().run();
  } else {
    props.editor.chain().focus().setColor(color).run();
  }
};

const setBgColor = (color: string | null) => {
  if (color === null) {
    props.editor.chain().focus().unsetHighlight().run();
  } else {
    props.editor.chain().focus().setHighlight({ color }).run();
  }
};
</script>

<template>
  <div class="relative" ref="btnRef">
    <!-- 触发按钮：Type 图标 + 底部颜色指示条 -->
    <IconTipButton
      tooltip="字体颜色 / 背景色"
      :isActive="isOpen || hasAnyColor"
      @click="isOpen = !isOpen"
    >
      <div class="flex flex-col items-center gap-px">
        <Type class="w-4 h-4" />
        <!-- 当前字体颜色指示条 -->
        <div
          class="w-3.5 h-0.75 rounded-full transition-colors"
          :style="{ background: indicatorColor }"
        />
      </div>
    </IconTipButton>

    <!-- 颜色面板弹窗 -->
    <BasePop
      v-model="isOpen"
      :trigger-ref="btnRef"
      class="right-0 top-full mt-3 p-3 w-52 border border-border/40"
    >
      <!-- 字体颜色 -->
      <div>
        <p class="text-xs text-fg-subtle font-medium mb-2">字体颜色</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="c in textColors"
            :key="c.label"
            :title="c.label"
            class="w-5 h-5 rounded-full transition-transform hover:scale-110"
            :class="{
              'ring-2 ring-accent ring-offset-1 ring-offset-bg-card':
                currentTextColor === c.value,
            }"
            :style="
              c.value
                ? { background: c.value, border: '1px solid rgba(255,255,255,0.12)' }
                : { background: 'transparent', border: '1.5px dashed #9ca3af' }
            "
            @mousedown.prevent="setTextColor(c.value)"
          />
        </div>
      </div>

      <div class="w-full h-px bg-border/40 my-2.5" />

      <!-- 背景颜色 -->
      <div>
        <p class="text-xs text-fg-subtle font-medium mb-2">背景颜色</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="c in bgColors"
            :key="c.label"
            :title="c.label"
            class="w-5 h-5 rounded-full transition-transform hover:scale-110"
            :class="{
              'ring-2 ring-accent ring-offset-1 ring-offset-bg-card':
                currentBgColor === c.value,
            }"
            :style="
              c.value
                ? { background: c.value, border: '1px solid rgba(255,255,255,0.12)' }
                : { background: 'transparent', border: '1.5px dashed #9ca3af' }
            "
            @mousedown.prevent="setBgColor(c.value)"
          />
        </div>
      </div>
    </BasePop>
  </div>
</template>
