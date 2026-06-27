<!-- src/views/admin/components/posts/editor/content/menus/category-menu/CategoryMenu.vue -->
<script setup lang="ts">
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import type { MenuGroup, MenuItem } from "./category-menu.types";

/**
 * CategoryMenu — 通用分类菜单（以表格 icon 下拉为蓝图抽象）
 *
 * 接收 groups 数据驱动渲染：
 * - 每组可带标题（group.title）；组与组之间自动插入分隔线。
 * - 组内布局 group.layout：
 *   · "list"（默认）：icon + 文字逐行，复用 ButtonSecondary，尺寸/间距沿用表格菜单蓝图
 *     （w-full / justify-start / gap-2.5 / px-2.5 / py-2，图标 h-4 w-4）。
 *   · "grid"：纯 icon 横向网格，复用带 Tooltip 的 IconTipButton（w-8 h-8，图标 h-5 w-5），
 *     列数由 group.cols 决定（默认 4）。
 *
 * 本组件只负责布局与样式，不含外层卡片（宽度/内边距/圆角由 DropButton content-class 提供）。
 * 动作交给 item.onSelect；同时对外 emit("select", item) 方便统一处理（如关闭弹层）。
 */
defineProps<{ groups: MenuGroup[] }>();

const emit = defineEmits<{ select: [item: MenuItem] }>();

const onSelect = (item: MenuItem) => {
  if (item.disabled) return;
  item.onSelect?.();
  emit("select", item);
};
</script>

<template>
  <div class="flex flex-col">
    <template v-for="(group, gi) in groups" :key="group.key">
      <!-- 组间分隔线（首组前不加） -->
      <div v-if="gi > 0" class="my-1 h-px bg-border/40" />

      <div>
        <!-- 组标题（可选） -->
        <div
          v-if="group.title"
          class="px-1.5 pb-1 text-sm text-fg-soft select-none"
        >
          {{ group.title }}
        </div>

        <!-- grid：纯 icon 横向网格 -->
        <div
          v-if="group.layout === 'grid'"
          class="grid gap-0.5"
          :style="{
            gridTemplateColumns: `repeat(${group.cols ?? 4}, minmax(0, 1fr))`,
          }"
        >
          <IconTipButton
            v-for="item in group.items"
            :key="item.key"
            :tooltip="item.tooltip ?? item.label ?? ''"
            :is-active="item.active"
            :danger="item.danger"
            size="w-8 h-8"
            @click="onSelect(item)"
          >
            <component :is="item.icon" class="h-5 w-5" />
          </IconTipButton>
        </div>

        <!-- list：icon + 文字逐行 -->
        <div v-else class="flex flex-col gap-0.5">
          <ButtonSecondary
            v-for="item in group.items"
            :key="item.key"
            class="w-full! justify-start! gap-2.5! px-2.5! py-2!"
            :class="
              item.danger ? 'text-red-500! hover:text-red-600!' : undefined
            "
            :is-active="item.active"
            :disabled="item.disabled"
            :text="item.label"
            @click="onSelect(item)"
          >
            <component :is="item.icon" class="h-4 w-4" />
          </ButtonSecondary>
        </div>
      </div>
    </template>
  </div>
</template>
