<!-- src/views/admin/components/posts/editor/content/menus/bubble/buttons/BubbleColorButton.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import type { Editor } from "@tiptap/core";
import { Type } from "lucide-vue-next";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import BasePop from "@/components/base/pop/BasePop.vue";
import { useLang } from "@/composables/lang.hook";
import ColorSwatchGrid from "./parts/ColorSwatchGrid.vue";

/**
 * BubbleColorButton — 字体颜色 & 背景高亮选色器
 *
 * 复用 BasePop + IconTipButton，模式与 BubbleLinkButton 一致。
 * - 上半区：预设字体颜色（Color 扩展）
 * - 下半区：预设背景高亮色（Highlight 扩展，multicolor）
 *
 * 色板（含自定义取色）抽到 ColorSwatchGrid 共享；色名 / 标题走 i18n（colorMenu.*）。
 */
const props = defineProps<{ editor: Editor }>();

const { t } = useLang();

const isOpen = ref(false);
const btnRef = ref<HTMLElement | null>(null);

/**
 * 字体颜色预设 — Tailwind 600 级，饱和度统一，深浅背景均可辨识。
 * key 对应 colorMenu.colors.* 的 i18n 文案。
 */
const textColors = [
  { key: "default", value: null },
  { key: "gray", value: "#6B7280" },
  { key: "brown", value: "#92400E" },
  { key: "orange", value: "#EA580C" },
  { key: "yellow", value: "#D97706" },
  { key: "green", value: "#16A34A" },
  { key: "blue", value: "#2563EB" },
  { key: "purple", value: "#7C3AED" },
  { key: "pink", value: "#DB2777" },
  { key: "red", value: "#DC2626" },
];

/**
 * 背景高亮颜色预设 — rgba 直接复用文字色 RGB，色相天然对齐。
 * 透明度 0.12 ~ 0.14（600 级饱和度高，浓度低也足够辨识）。
 */
const bgColors = [
  { key: "none", value: null },
  { key: "gray", value: "rgba(107,114,128,0.14)" },
  { key: "brown", value: "rgba(146,64,14,0.12)" },
  { key: "orange", value: "rgba(234,88,12,0.12)" },
  { key: "yellow", value: "rgba(217,119,6,0.14)" },
  { key: "green", value: "rgba(22,163,74,0.12)" },
  { key: "blue", value: "rgba(37,99,235,0.12)" },
  { key: "purple", value: "rgba(124,58,237,0.12)" },
  { key: "pink", value: "rgba(219,39,119,0.12)" },
  { key: "red", value: "rgba(220,38,38,0.12)" },
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
const indicatorColor = computed(() => currentTextColor.value ?? "currentColor");

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
      :tooltip="t('views.admin.PostEditor.content.colorMenu.tooltip')"
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
        <p class="text-xs text-fg-subtle font-medium mb-2">
          {{ t("views.admin.PostEditor.content.colorMenu.textColor") }}
        </p>
        <ColorSwatchGrid
          :colors="textColors"
          :current="currentTextColor"
          @select="setTextColor"
        />
      </div>

      <div class="w-full h-px bg-border/40 my-2.5" />

      <!-- 背景颜色 -->
      <div>
        <p class="text-xs text-fg-subtle font-medium mb-2">
          {{ t("views.admin.PostEditor.content.colorMenu.bgColor") }}
        </p>
        <ColorSwatchGrid
          :colors="bgColors"
          :current="currentBgColor"
          @select="setBgColor"
        />
      </div>
    </BasePop>
  </div>
</template>
