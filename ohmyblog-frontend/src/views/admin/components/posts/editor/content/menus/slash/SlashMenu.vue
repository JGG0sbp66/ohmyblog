<!-- src/views/admin/components/posts/editor/content/menus/slash/SlashMenu.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import type { Editor, Range } from "@tiptap/core";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useLang } from "@/composables/lang.hook";
import { filterSlashCommands, useSlashI18n } from "./slash-commands";

/**
 * SlashMenu — Notion 风格 / 命令面板
 *
 * 由 slash.extension 在用户输入 "/" 时挂载到 body 并定位。
 * 菜单项复用 ButtonSecondary，与 GroupedDropButton / BubbleBlockSection
 * 视觉保持一致（icon + 单行文字，激活态自动响应）。
 *
 * 视窗边界处理：菜单优先贴 "/" 下方；下方空间不足则翻到上方。
 * 水平方向左对齐 "/" 起点；超出右边界则向左 clamp 进视窗。
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
const { t } = useLang();

const query = ref("");
// 当前 "/xxx" 区间：随用户键入增长。不能直接用 props.range——它只在挂载
// （onStart）时取一次，那时只有 "/"，否则 deleteRange 删不掉后续键入的 query。
const currentRange = ref<Range>(props.range);
const selectedIndex = ref(0);
const listRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

const items = computed(() => filterSlashCommands(query.value, labelOf));

/** 弹层位置（绝对 viewport 坐标，按需翻转） */
const position = ref({ top: 0, left: 0 });

const VIEWPORT_PADDING = 8; // 距离视窗边缘的最小留白
const ANCHOR_GAP = 8; // 菜单与 "/" 的间距

/**
 * 算菜单位置：
 * 1. 默认贴 "/" 下方
 * 2. 下方剩余空间装不下完整菜单 → 翻到上方
 * 3. left 超出右边界 → 向左 clamp
 */
const updatePosition = () => {
  const rect = props.clientRect();
  const panel = panelRef.value;
  if (!rect || !panel) return;

  const panelRect = panel.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 垂直：默认下方，空间不足则翻上
  const spaceBelow = vh - rect.bottom - VIEWPORT_PADDING;
  const spaceAbove = rect.top - VIEWPORT_PADDING;
  const placeBelow =
    spaceBelow >= panelRect.height + ANCHOR_GAP || spaceBelow >= spaceAbove; // 都装不下时选空间多的一侧
  const top = placeBelow
    ? rect.bottom + ANCHOR_GAP
    : rect.top - panelRect.height - ANCHOR_GAP;

  // 水平：左对齐 "/"，超出右边界则向左收
  const maxLeft = vw - panelRect.width - VIEWPORT_PADDING;
  const left = Math.max(VIEWPORT_PADDING, Math.min(rect.left, maxLeft));

  position.value = { top, left };
};

/** items 变化菜单高度变 → 下一帧重新定位 */
watch(items, () => {
  selectedIndex.value = 0;
  nextTick(updatePosition);
});

onMounted(() => {
  // 首次挂载需要 DOM 渲染完成才能测高度
  nextTick(updatePosition);
});

const select = (index: number) => {
  const cmd = items.value[index];
  if (!cmd) return;
  cmd.run(props.editor, currentRange.value);
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

defineExpose({
  /** suggestion 通知 query 变化 */
  updateQuery(next: string) {
    query.value = next;
  },
  /** suggestion 通知 "/xxx" 区间变化（随键入增长），run 时据此删除 */
  updateRange(next: Range) {
    currentRange.value = next;
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
      ref="panelRef"
      class="fixed z-50 bg-bg-card border border-border/40 rounded-xl shadow-xl py-1.5 min-w-56 max-h-80 overflow-hidden flex flex-col"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    >
      <div
        v-if="items.length === 0"
        class="px-3 py-3 text-sm text-fg-soft text-center"
      >
        {{ t("views.admin.PostEditor.content.slashMenu.empty") }}
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
