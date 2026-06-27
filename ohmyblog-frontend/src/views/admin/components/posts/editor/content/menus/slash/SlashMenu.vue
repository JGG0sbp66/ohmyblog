<!-- src/views/admin/components/posts/editor/content/menus/slash/SlashMenu.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import type { Editor, Range } from "@tiptap/core";
import { useLang } from "@/composables/lang.hook";
import CategoryMenu from "../category-menu/CategoryMenu.vue";
import type { MenuGroup, MenuItem } from "../category-menu/category-menu.types";
import { useImageInsert } from "../../composables/use-image-insert";
import { useAnchoredPosition } from "../../composables/use-anchored-position";
import {
  filterSlashGroups,
  useSlashI18n,
  type SlashCommand,
} from "./slash-commands";

/**
 * SlashMenu — Notion / 飞书 风格 / 命令面板（分组 + 标题，复用 CategoryMenu 渲染）
 *
 * 由 slash.extension 在用户输入 "/" 时挂载到 body 并定位。
 * 渲染交给 CategoryMenu（组标题 + icon+文字行），本组件保留键盘流的全部编排：
 * 过滤、上下/Enter 导航、选中项 scrollIntoView、视窗翻转定位。
 *
 * 键盘游标 selectedIndex 是「扁平索引」（跨组连续），active = 扁平下标命中。
 * 滚动定位用 querySelectorAll('button')[index]：组标题是 <div> 不计入，按钮即命令行，
 * 故扁平下标与按钮顺序一一对应，分组插入标题不影响定位。
 *
 * 所有交互通过 expose 给 extension 调用：
 * - updateQuery(query) : 用户键入字符，刷新过滤
 * - updateRange(range) : "/xxx" 区间随键入增长，run 时据此 deleteRange
 * - onKeyDown(evt)     : 键盘事件透传（上/下/Enter）
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
const { pickAndInsert } = useImageInsert();

const query = ref("");
// 当前 "/xxx" 区间：随用户键入增长。不能直接用 props.range——它只在挂载
// （onStart）时取一次，那时只有 "/"，否则 deleteRange 删不掉后续键入的 query。
const currentRange = ref<Range>(props.range);
const selectedIndex = ref(0);
const listRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

/** 过滤后的分组（保留组标题，丢弃空组） */
const groups = computed(() => filterSlashGroups(query.value, labelOf));
/** 跨组扁平命令列表：键盘导航与 run 的真源 */
const flatItems = computed<SlashCommand[]>(() =>
  groups.value.flatMap((g) => g.commands),
);

/** 映射成 CategoryMenu 数据：list 布局 + 组标题，active 走扁平下标 */
const menuGroups = computed<MenuGroup[]>(() => {
  let flatIndex = 0;
  return groups.value.map((group) => ({
    key: group.labelKey ?? "more",
    title: group.labelKey
      ? t(`views.admin.PostEditor.content.slashMenu.groups.${group.labelKey}`)
      : undefined,
    layout: "list",
    items: group.commands.map<MenuItem>((cmd) => {
      const index = flatIndex++;
      return {
        key: cmd.id,
        icon: cmd.icon,
        iconClass: cmd.color,
        label: labelOf(cmd),
        danger: group.danger,
        active: index === selectedIndex.value,
        onSelect: () => select(index),
      };
    }),
  }));
});

/**
 * 弹层位置：贴 "/" 下方，空间不足翻上，左对齐 "/" 并 clamp 进视口。
 * 复用编辑器统一的浮层智能定位逻辑（见 useAnchoredPosition）。
 */
const { position, update: updatePosition } = useAnchoredPosition({
  getAnchorRect: () => props.clientRect(),
  getPanel: () => panelRef.value,
});

/** items 变化菜单高度变 → 下一帧重新定位 */
watch(groups, () => {
  selectedIndex.value = 0;
  nextTick(updatePosition);
});

onMounted(() => {
  // 首次挂载需要 DOM 渲染完成才能测高度
  nextTick(updatePosition);
});

const select = (index: number) => {
  const cmd = flatItems.value[index];
  if (!cmd) return;
  cmd.run(props.editor, currentRange.value);
  // 图片项：run 只删了 "/img" 文本，这里接着弹文件框上传插入
  // （pickAndInsert 依赖 setup 的 useImageInsert，故由组件而非命令 run 触发）
  if (cmd.id === "image") pickAndInsert(props.editor);
};

const onArrow = (delta: 1 | -1) => {
  const len = flatItems.value.length;
  if (len === 0) return;
  selectedIndex.value = (selectedIndex.value + delta + len) % len;
  scrollSelectedIntoView();
};

const onEnter = () => {
  select(selectedIndex.value);
};

/** 鼠标悬停同步键盘游标（item.key === cmd.id） */
const onHover = (item: MenuItem) => {
  const index = flatItems.value.findIndex((c) => c.id === item.key);
  if (index >= 0) selectedIndex.value = index;
};

const scrollSelectedIntoView = () => {
  nextTick(() => {
    // 组标题为 <div>，命令行为 <button>，故按钮顺序 == 扁平下标顺序
    const buttons = panelRef.value?.querySelectorAll<HTMLElement>("button");
    buttons?.[selectedIndex.value]?.scrollIntoView({ block: "nearest" });
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
      class="fixed z-50 flex max-h-80 min-w-56 flex-col overflow-hidden rounded-xl border border-border/40 bg-bg-card py-1.5 shadow-xl"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    >
      <div
        v-if="flatItems.length === 0"
        class="px-3 py-3 text-center text-sm text-fg-soft"
      >
        {{ t("views.admin.PostEditor.content.slashMenu.empty") }}
      </div>
      <div v-else ref="listRef" class="overflow-y-auto px-1">
        <CategoryMenu :groups="menuGroups" @hover="onHover" />
      </div>
    </div>
  </Teleport>
</template>
