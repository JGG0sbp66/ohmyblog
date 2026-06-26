<!-- src/views/admin/components/posts/editor/content/menus/bubble/buttons/BubbleCellBgButton.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import type { Editor } from "@tiptap/core";
import { PaintBucket } from "lucide-vue-next";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import BasePop from "@/components/base/pop/BasePop.vue";
import { useLang } from "@/composables/lang.hook";
import { useTableCommands } from "../composables/use-table-commands";
import ColorSwatchGrid from "./parts/ColorSwatchGrid.vue";

/**
 * BubbleCellBgButton — 表格单元格背景色选色器
 *
 * 模式与 BubbleColorButton 一致（BasePop + ColorSwatchGrid）。预设色值复用文字色板的
 * 低透明度 rgba：明暗主题下都安全（叠在主题底色上），无需单独 .dark 覆盖。
 * 跨格 CellSelection 时一次着色所有选中格（setCellAttribute 内部遍历）。
 */
const props = defineProps<{ editor: Editor }>();

const { t } = useLang();
const { currentCellBg, setCellBg } = useTableCommands();

const isOpen = ref(false);
const btnRef = ref<HTMLElement | null>(null);

/** 单元格背景预设 —— 低透明度 rgba，明暗模式自适配。key 对应 colorMenu.colors.* */
const cellColors = [
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

const current = computed(() => currentCellBg(props.editor));

const apply = (color: string | null) => setCellBg(props.editor, color);
</script>

<template>
  <div class="relative" ref="btnRef">
    <IconTipButton
      :tooltip="t('views.admin.PostEditor.content.tableMenu.cellBackground')"
      :is-active="isOpen || current !== null"
      @click="isOpen = !isOpen"
    >
      <PaintBucket class="h-4 w-4" />
    </IconTipButton>

    <BasePop
      v-model="isOpen"
      :trigger-ref="btnRef"
      class="left-0 top-full mt-3 p-3 w-52 border border-border/40"
    >
      <p class="text-xs text-fg-subtle font-medium mb-2">
        {{ t("views.admin.PostEditor.content.tableMenu.cellBackground") }}
      </p>
      <ColorSwatchGrid
        :colors="cellColors"
        :current="current"
        @select="apply"
      />
    </BasePop>
  </div>
</template>
