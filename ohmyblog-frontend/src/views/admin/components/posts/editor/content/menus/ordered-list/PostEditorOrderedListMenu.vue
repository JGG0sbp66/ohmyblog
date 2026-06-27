<!-- src/views/admin/components/posts/editor/content/menus/ordered-list/PostEditorOrderedListMenu.vue -->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { Editor } from "@tiptap/core";
import { RotateCcw, ListRestart, Pencil } from "lucide-vue-next";
import { useEventListener } from "@vueuse/core";
import BasePop from "@/components/base/pop/BasePop.vue";
import CategoryMenu from "../category-menu/CategoryMenu.vue";
import type { MenuGroup } from "../category-menu/category-menu.types";
import { useLang } from "@/composables/lang.hook";
import { useOrderedListMenu } from "./composables/use-ordered-list-menu";
import { useAnchoredPosition } from "../../composables/use-anchored-position";

/**
 * PostEditorOrderedListMenu — 有序列表「编号」菜单（单一入口：点击序号）
 *
 * 序号由 OrderedListNumber 扩展渲染成真实 <span.ol-number>（hover 主题色高亮 + tooltip）。
 * 本组件事件委托监听编辑器内对 .ol-number 的 mousedown，在序号下方弹出菜单：
 * - 继续之前的编号（接续最近前一张同级 orderedList；无则禁用）
 * - 开始新列表（start=1；已是 1 时禁用）
 * - 修改编号值（点击切到内联数字输入框，回车设 start）
 *
 * 弹层复用 BasePop（pop 过渡动画 + onClickOutside + 卡片样式），Teleport + fixed 定位。
 * 被点的序号作为 trigger-ref 传给 BasePop，避免「同一次点击刚开就被判为外部点击关掉」。
 */
const props = defineProps<{ editor: Editor }>();

const { t } = useLang();
const {
  canContinue,
  prevEndNumber,
  listStart,
  itemNumber,
  restartAt,
  continueFromPrev,
} = useOrderedListMenu(props.editor);

const open = ref(false);
const listPos = ref(-1);
const index = ref(0);
const editing = ref(false);
const triggerEl = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const GAP = 6;

/**
 * 弹层位置：贴序号下方，空间不足翻上，左对齐序号并 clamp 进视口。
 * 复用编辑器统一的浮层智能定位逻辑（见 useAnchoredPosition）。
 * 锚点取被点击的序号元素，面板取 BasePop 渲染出的 .ol-num-pop。
 */
const { position: anchor, update: updatePosition } = useAnchoredPosition({
  getAnchorRect: () => triggerEl.value?.getBoundingClientRect() ?? null,
  getPanel: () => document.querySelector<HTMLElement>(".ol-num-pop"),
  gap: GAP,
});

/** 被点项当前显示的编号（输入框初值 = 该项现在的数字） */
const currentNumber = computed(() => itemNumber(listPos.value, index.value));

const close = () => (open.value = false);
watch(open, (v) => {
  if (!v) editing.value = false;
});

const openAt = (el: HTMLElement) => {
  const pos = Number(el.getAttribute("data-ol-list-pos"));
  if (Number.isNaN(pos)) return;
  triggerEl.value = el;
  listPos.value = pos;
  index.value = Number(el.getAttribute("data-ol-index")) || 0;
  editing.value = false;
  open.value = true;
  // 先同步按锚点做下方预定位（首帧即落位，避免 BasePop transition:all 把
  // 初值 (0,0) 当动画起点「从左上角飞入」），再于 nextTick 用真实面板尺寸
  // 精修（上下翻转 + 水平 clamp）
  updatePosition();
  nextTick(updatePosition);
};

// 点击序号 → 打开菜单（preventDefault 防止编辑器移动光标 / 失焦）
useEventListener(
  () => props.editor.view.dom,
  "mousedown",
  (e: MouseEvent) => {
    const el = (e.target as HTMLElement)?.closest?.(
      ".ol-number",
    ) as HTMLElement | null;
    if (!el) return;
    e.preventDefault();
    openAt(el);
  },
);
useEventListener(window, "scroll", () => close(), true);
useEventListener(window, "keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape") close();
});

const beginEdit = () => {
  editing.value = true;
  nextTick(() => inputRef.value?.focus());
};

const applyStart = (raw: string) => {
  const n = Number.parseInt(raw, 10);
  if (!Number.isNaN(n)) restartAt(listPos.value, index.value, n);
  close();
};

const menuGroups = computed<MenuGroup[]>(() => {
  const pos = listPos.value;
  const i = index.value;
  const prevEnd = prevEndNumber(pos);
  const continueLabel = t(
    "views.admin.PostEditor.content.orderedListMenu.continue",
  );
  // 「继续之前的编号」仅对列表首项 + 存在前一张同级列表时有意义
  const canDoContinue = i === 0 && prevEnd !== null;
  return [
    {
      key: "renumber",
      layout: "list",
      items: [
        {
          key: "continue",
          icon: RotateCcw,
          label:
            canDoContinue && prevEnd !== null
              ? `${continueLabel}（${prevEnd + 1}）`
              : continueLabel,
          disabled: !canDoContinue,
          onSelect: () => {
            continueFromPrev(pos);
            close();
          },
        },
        {
          key: "reset",
          icon: ListRestart,
          label: t("views.admin.PostEditor.content.orderedListMenu.startNew"),
          // 已是首项且从 1 开始 → 重开无意义
          disabled: i === 0 && listStart(pos) === 1,
          onSelect: () => {
            restartAt(pos, i, 1);
            close();
          },
        },
        {
          key: "setStart",
          icon: Pencil,
          label: t("views.admin.PostEditor.content.orderedListMenu.setStart"),
          onSelect: beginEdit,
        },
      ],
    },
  ];
});
</script>

<template>
  <Teleport to="body">
    <BasePop
      v-model="open"
      :trigger-ref="triggerEl"
      class="ol-num-pop fixed! w-56 p-1.5"
      :style="{ top: `${anchor.top}px`, left: `${anchor.left}px` }"
    >
      <CategoryMenu v-if="!editing" :groups="menuGroups" />
      <div v-else class="flex items-center gap-2.5 px-2.5 py-2">
        <Pencil class="h-4 w-4 shrink-0 text-fg-soft" />
        <span class="flex-1 text-sm text-fg">
          {{ t("views.admin.PostEditor.content.orderedListMenu.setStart") }}
        </span>
        <input
          ref="inputRef"
          type="number"
          min="1"
          :value="currentNumber"
          class="w-14 rounded-md border border-border/40 bg-bg-muted px-1.5 py-0.5 text-right text-sm text-fg focus:outline-none"
          @keydown.enter.prevent="
            applyStart(($event.target as HTMLInputElement).value)
          "
          @keydown.esc="close"
        />
      </div>
    </BasePop>
  </Teleport>
</template>
