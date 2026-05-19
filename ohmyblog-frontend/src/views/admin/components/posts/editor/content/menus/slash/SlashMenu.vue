<!-- src/views/admin/components/posts/editor/content/menus/slash/SlashMenu.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { Editor, Range } from "@tiptap/core";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import {
  filterSlashCommands,
  useSlashI18n,
  type SlashCommand,
} from "./slash-commands";

/**
 * SlashMenu — Notion 风格 / 命令面板
 *
 * 由 slash.extension 在用户输入 "/" 时挂载到 body 并定位。
 * 菜单项复用 ButtonSecondary，与 GroupedDropButton / BubbleBlockSection
 * 视觉保持一致（icon + 单行文字，激活态自动响应）。
 *
 * 所有交互通过 expose 给 extension 调用：
 * - update(query)  : 用户键入字符，刷新过滤
 * - onKeyDown(evt) : 键盘事件透传（上/下/Enter）
 */
const props = defineProps<{
  editor: Editor;
  /** Tiptap suggestion 提供的"/foo"区间，run 时用于 deleteRange */
  range: Range;
  /** 弹层 viewport 坐标（top/left/bottom，用于上下翻转） */
  clientRect: () => DOMRect | null;
}>();

const { labelOf } = useSlashI18n();

const query = ref("");
const selectedIndex = ref(0);
const listRef = ref<HTMLElement | null>(null);

const items = computed(() => filterSlashCommands(query.value, labelOf));

/** 弹层位置：贴在 "/" 字符的 bottom 下方 8px */
const position = computed(() => {
  const rect = props.clientRect();
  if (!rect) return { top: 0, left: 0 };
  return { top: rect.bottom + 8, left: rect.left };
});

const select = (index: number) => {
  const cmd = items.value[index];
  if (!cmd) return;
  cmd.run(props.editor, props.range);
};

const onArrow = (delta: 1 | -1) => {
  const len = items.value.length;
  if (len === 0) return;
  selectedIndex.value = (selectedIndex.value + delta + len) % len;
  scrollSelectedIntoView();
};

const onEnter = () => {
  select(selectedIndex.value);
};

const scrollSelectedIntoView = () => {
  nextTick(() => {
    const list = listRef.value;
    if (!list) return;
    const item = list.children[selectedIndex.value] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  });
};

/** query 改变重置选中（避免选中超出过滤后的范围） */
watch(items, () => {
  selectedIndex.value = 0;
});

defineExpose({
  /** suggestion 通知 query 变化 */
  updateQuery(next: string) {
    query.value = next;
  },
  /** suggestion 转发键盘事件，返回 true 表示已处理 */
  onKeyDown(event: KeyboardEvent): boolean {
    if (event.key === "ArrowDown") {
      onArrow(1);
      return true;
    }
    if (event.key === "ArrowUp") {
      onArrow(-1);
      return true;
    }
    if (event.key === "Enter") {
      onEnter();
      return true;
    }
    return false;
  },
});
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed z-50 bg-bg-card border border-border/40 rounded-xl shadow-xl py-1.5 min-w-56 max-h-80 overflow-hidden flex flex-col"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    >
      <div
        v-if="items.length === 0"
        class="px-3 py-3 text-sm text-fg-soft text-center"
      >
        {{ $t("views.admin.PostEditor.content.slashMenu.empty") }}
      </div>
      <div
        v-else
        ref="listRef"
        class="overflow-y-auto px-1 flex flex-col gap-0.5"
      >
        <ButtonSecondary
          v-for="(cmd, i) in items"
          :key="cmd.id"
          :is-active="i === selectedIndex"
          :text="labelOf(cmd)"
          class="w-full justify-start px-2.5 py-1.5 text-sm"
          @mousedown.prevent="select(i)"
          @mouseenter="selectedIndex = i"
        >
          <component :is="cmd.icon" class="w-4 h-4 shrink-0" />
        </ButtonSecondary>
      </div>
    </div>
  </Teleport>
</template>
