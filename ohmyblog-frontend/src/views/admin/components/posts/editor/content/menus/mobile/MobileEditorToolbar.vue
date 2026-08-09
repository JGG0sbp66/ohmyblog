<!-- src/views/admin/components/posts/editor/content/menus/mobile/MobileEditorToolbar.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Editor } from "@tiptap/core";
import { useResizeObserver } from "@vueuse/core";
import { Plus, X } from "lucide-vue-next";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useLang } from "@/composables/lang.hook";
import { useKeyboardInset } from "@/composables/keyboard-inset.hook";
import { setEditorHeaderHold } from "@/composables/editor-header.hook";
import { useEditorDock } from "@/composables/editor-dock.hook";
import { useImageInsert } from "../../composables/use-image-insert";
import type { SlashCommand } from "../slash/slash-commands";
import MobileInsertSheet from "./MobileInsertSheet.vue";
import MobileLinkButton from "./MobileLinkButton.vue";
import { TOOLBAR_SEGMENTS, type ToolbarItem } from "./mobile-toolbar-items";

/**
 * MobileEditorToolbar — 移动端键盘吸附工具条
 *
 * 桌面端靠气泡菜单（选中才出）+ 左侧悬浮手柄（hover 才出）+ `/` 命令三件套；
 * 后两者在触屏上不存在，气泡菜单又会和系统自带的选择气泡（拷贝/查询）抢位置。
 * 所以移动端改走另一套：一条常驻在键盘上沿的横向工具条，覆盖三者的并集。
 *
 * 四个关键决策：
 *
 * 1. 贴合靠 `interactive-widget=resizes-content`（见 index.html 的 viewport meta），
 *    键盘直接压缩 layout viewport，`bottom: 0` 天然落在键盘上沿。iOS 不支持这个
 *    声明，那边靠 keyboard-inset.hook 反推遮挡量补一个 bottom 偏移。
 *
 * 2. 插入面板向「下」开，顶替键盘的位置，而不是向上盖住正文（Notion / 飞书同款）。
 *    点开 "+" 时主动 blur 收起键盘，选完/收起后再 focus 把键盘唤回来。
 *    键盘出入场有约 250ms 动画，这段时间里工具条必须不动 —— 做法见 rootStyle。
 *
 * 3. 根节点阻止 mousedown 默认行为。触屏上点按钮如果让编辑器失焦，键盘会收起、
 *    工具条跟着塌下去，然后命令里的 .focus() 又把它拉回来 —— 一次点击闪两下。
 *    阻止默认行为即可保住焦点，事件本身照常冒泡到按钮的 @click。
 *    唯一例外是链接 URL 输入框，它必须真的能拿到焦点，见 onRootMouseDown。
 *
 * 4. 显隐跟随编辑器焦点，而不是「移动端就常驻」。没在打字时它只会挡住正文；
 *    blur 做了 120ms 防抖，避免点按钮那一瞬的焦点抖动导致闪烁。
 */
const props = defineProps<{ editor: Editor }>();

const { t } = useLang();
const { inset, keyboardOpen } = useKeyboardInset();
const { setDockHeight } = useEditorDock();
const { pickAndInsert } = useImageInsert();

const rootRef = ref<HTMLElement | null>(null);
const focused = ref(false);
let blurTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * 面板开关。一个布尔，图标、高亮、点击处理全读它 —— 三者读同一个值是硬要求，
 * 分开读过一次，结果出现「图标已变 X、点击却走打开分支」的自相矛盾状态。
 */
const sheetOpen = ref(false);

/**
 * 工具条显隐。
 * - 面板打开时编辑器是被我们主动 blur 的，靠 sheetOpen 留住
 * - 链接弹层打开时焦点在它的 input 上，靠 focused 留住（见 onBlur 的守卫）
 */
const visible = computed(() => focused.value || sheetOpen.value);

/**
 * 展开面板时把工具条钉住的 top 坐标（layout viewport 坐标系，同 fixed 的 top）。
 * 在「按下 + 之后、blur 之前」量一次 —— 那时键盘还没开始退场、视口还没变。
 */
const pinnedTop = ref<number | null>(null);
/** 关闭后延迟解钉的计时器；键盘回场动画大约这么长 */
let unpinTimer: ReturnType<typeof setTimeout> | undefined;
const PIN_RELEASE_MS = 320;

/**
 * 工具条定位。
 *
 * 收起态：只钉 bottom。inset 只在 iOS（resizes-visual）下非零；Chromium 走
 * resizes-content，layout viewport 已经替我们让出了键盘，恒为 0。
 *
 * 展开态：**同时钉 top 和 bottom**。top 是打开前量到的自身位置，工具条因此在
 * 整段键盘退场动画里不动；容器下沿贴视口底，中间的面板 flex-1 —— 键盘退场腾出
 * 多少空间，面板就长多少。这个方案不需要知道键盘有多高（试过预测，见 hook 注释）。
 *
 * 关闭时钉子多留 PIN_RELEASE_MS 再撤，让键盘先回到位；这是个固定时长而不是等
 * 某个信号，宁可在极端情况下差几十毫秒，也不要再卡死一次。
 */
const rootStyle = computed<Record<string, string>>(() => {
  return {
    bottom: `${inset.value}px`,
    ...(pinnedTop.value !== null ? { top: `${pinnedTop.value}px` } : {}),
    // 键盘（或顶替它的插入面板）铺在下面时，手势条区域已经被盖住，
    // 再垫一层 safe-area 只会在键盘上方多出一条缝
    paddingBottom:
      keyboardOpen.value || sheetOpen.value
        ? "0px"
        : "env(safe-area-inset-bottom, 0px)",
  };
});

/**
 * 打开面板前存下的光标位置（不参与渲染，普通变量即可）。
 *
 * 为什么必须存：`commands.blur()` 会让 contenteditable 失焦，部分安卓输入法在
 * 这一刻把 DOM selection 重置到文档开头，而 ProseMirror 的 DOM 观察器会把它当成
 * 用户操作写回 state.selection。关面板和执行插入命令都以这份快照为准，
 * 不依赖 blur 之后的 state。
 */
let savedSelection: { from: number; to: number } | null = null;

/**
 * 在开合面板 / 执行命令的整段过渡里按住正文的滚动位置。
 *
 * 这里立的是一条**结果约束**：这些操作不许改变阅读位置。之所以不去逐个堵源头，
 * 是因为参与方太多且互相叠加 —— blur 让输入法重置 DOM selection、ProseMirror 把它
 * 当用户操作接下来并滚过去、键盘退场改变容器高度、浏览器再做滚动锚定与夹取。
 *
 * 连续按住 ~20 帧（约 330ms，覆盖键盘出入场动画）而不是只设一次：这段时间里布局
 * 会变好几轮，只改一次会被后面的调整覆盖掉。
 */
const HOLD_FRAMES = 20;
let holdRaf = 0;

const holdScroll = () => {
  const scroller = props.editor.view.dom.closest<HTMLElement>(
    "[data-editor-scroll]",
  );
  if (!scroller) return;
  const keep = scroller.scrollTop;
  cancelAnimationFrame(holdRaf);
  let n = 0;
  const tick = () => {
    if (scroller.scrollTop !== keep) scroller.scrollTop = keep;
    if (++n < HOLD_FRAMES) holdRaf = requestAnimationFrame(tick);
    else holdRaf = 0;
  };
  holdRaf = requestAnimationFrame(tick);
};

/** 打开面板 = 用面板换掉键盘 */
const openSheet = () => {
  clearTimeout(unpinTimer);
  const { from, to } = props.editor.state.selection;
  savedSelection = { from, to };
  // 必须在 blur 之前量：blur 一发出去，键盘就开始退场、视口开始变化
  pinnedTop.value = rootRef.value?.getBoundingClientRect().top ?? null;
  sheetOpen.value = true;
  holdScroll();
  props.editor.commands.blur();
};

/**
 * 关闭面板（点 X）= 把键盘和光标一起换回来。
 * focus() 必须发生在用户手势的调用栈里，iOS/Android 才允许重新唤起输入法。
 */
const closeSheet = () => {
  if (!sheetOpen.value) return;
  sheetOpen.value = false;
  holdScroll();
  const sel = savedSelection;
  const chain = props.editor.chain();
  // 注意 focus() 的第一个参数只接受 'start' | 'end' | number 这类 FocusPosition，
  // 给不了区间，所以恢复选区要靠 setTextSelection。
  // scrollIntoView: false：光标本来就在视野里，让 focus 再滚一次只会把 holdScroll
  // 的努力抵消掉；真正需要滚动的场景不该由「关面板」这个动作来负责。
  if (sel) chain.setTextSelection(sel);
  chain.focus(undefined, { scrollIntoView: false }).run();
  savedSelection = null;
  schedulePinRelease();
};

/**
 * 在面板里选了某个命令 —— 执行权在这里而不在面板里，因为顺序是关键：
 *
 * 1. **先** holdScroll()：必须在文档被改动之前捕获滚动位置。命令内部都是
 *    chain().focus()，而 focus 默认会把选区滚进视野 —— 在它之后再捕获，钉住的就是
 *    已经滚走的位置。
 * 2. 恢复光标到打开面板前的位置。命令作用于 state.selection，光给 run() 传 range
 *    不够（那个参数只被 deleteRange 用到，救不了 toggleHeading 这类）。
 * 3. 跑命令。
 */
const onSheetSelect = (cmd: SlashCommand) => {
  holdScroll();
  sheetOpen.value = false;

  const anchor = savedSelection;
  savedSelection = null;
  if (anchor) props.editor.commands.setTextSelection(anchor);
  const pos = anchor?.from ?? props.editor.state.selection.from;

  cmd.run(props.editor, { from: pos, to: pos });
  // 图片项的 run 是空操作（见 slash-commands.IMAGE_COMMAND 的注释），
  // 真正的「弹文件框 → 上传 → 插入」依赖 setup 上下文，由消费方接管
  if (cmd.id === "image") pickAndInsert(props.editor);

  schedulePinRelease();
};

const schedulePinRelease = () => {
  clearTimeout(unpinTimer);
  unpinTimer = setTimeout(() => {
    pinnedTop.value = null;
  }, PIN_RELEASE_MS);
};

/**
 * 面板展开期间按住顶部栏的收起态。
 * 打开面板要主动 blur 编辑器（才能收键盘），而 editor-header.hook 把 focusout
 * 当成「停止编辑」会把顶部栏展开 —— 于是点一下「+」，「文章管理 / 写文章」那排
 * 就冒出来半截，白白吃掉刚腾出来的垂直空间。
 */
watch(sheetOpen, setEditorHeaderHold);

/**
 * 把自身实测高度上报给正文，让它在底部留出等高的空白。
 *
 * 这是「一点加号，页面跳回文章开头」的正解：浮层是 fixed 的、不占文档流，
 * 而键盘收起会让滚动容器长高、maxScroll 缩小，scrollTop 被夹到 0。留白让两者
 * 互相抵消（详见 editor-dock.hook 的注释）。
 *
 * 用 ResizeObserver 而不是常量：面板高度取决于键盘退场后腾出多少空间，是运行时
 * 才知道的值；而且工具条本身也会因为表格段的出现/消失而变化。
 */
useResizeObserver(rootRef, (entries) => {
  const el = entries[0]?.target as HTMLElement | undefined;
  if (el) setDockHeight(el.offsetHeight);
});

// 浮层隐藏时元素被卸载，ResizeObserver 不会再回调，必须显式归零，
// 否则正文底部会一直留着一段谁也不需要的空白
watch(visible, (v) => {
  if (!v) setDockHeight(0);
});

/**
 * 强制重算 isActive / isDisabled 的信号。
 *
 * 这些判定读的是 editor.state，而 Tiptap 的 editor 实例不是 Vue 响应式对象，
 * 光标一移动 computed 不会自己失效，所以订阅 transaction 撞一下计数器让它重算。
 *
 * 用 rAF 合并（同 editor-header.hook 的滚动采样）：transaction 每次按键都发，
 * 而一轮重算要跑六次 editor.can()——每次 can() 都会 dry-run 一个 transaction，
 * 连打时不合并会在低端机上拖慢输入。合并到每帧最多一次，视觉上无差别。
 */
const revision = ref(0);
let bumpFrame = 0;
const bump = () => {
  if (bumpFrame) return;
  bumpFrame = requestAnimationFrame(() => {
    bumpFrame = 0;
    revision.value++;
  });
};

const onFocus = () => {
  clearTimeout(blurTimer);
  focused.value = true;
};

/**
 * 编辑器失焦 → 延时收起工具条。
 *
 * 守卫「焦点还在工具条自己身上」这一条是必需的：点开链接按钮、把光标放进 URL
 * 输入框，编辑器一定会 blur，此时若照常收起，会把正在输入的那个弹层一起卸载掉
 * （输入框随之消失、键盘也跟着没了）。同 use-bubble-anchor 的处理思路。
 */
const onBlur = () => {
  clearTimeout(blurTimer);
  blurTimer = setTimeout(() => {
    if (rootRef.value?.contains(document.activeElement)) return;
    focused.value = false;
  }, 120);
};

/**
 * 根节点吞掉 mousedown 默认行为以保住编辑器焦点（见组件头部第 3 条）。
 *
 * 例外：BasePop 的弹层内部要放行。链接的 URL 输入框必须真的能获得焦点才能打字，
 * 一并拦掉的话表现就是「点不动那个输入框」。BasePop 给面板挂了 data-pop-panel，
 * 据此判断即可，不用把弹层从工具条里搬出去。
 */
const onRootMouseDown = (event: MouseEvent) => {
  if (
    event.target instanceof Element &&
    event.target.closest("[data-pop-panel]")
  ) {
    return;
  }
  event.preventDefault();
};

/**
 * 面板开着时点到工具条外面 → 收起面板。
 *
 * 这条不能靠编辑器的 blur 事件代劳：打开面板时我们已经主动 blur 过了，
 * 之后用户再点标题输入框 / 保存按钮，编辑器没有焦点可丢，blur 不会再来一次，
 * 面板就会一直挂在那儿。
 *
 * 不在这里 focus() 回编辑器：用户点的是别处，把焦点抢回来等于跟他对着干
 * （点进正文的话，那一下本身就会让编辑器重新获得焦点）。
 */
const onPointerDownOutside = (event: PointerEvent) => {
  if (!sheetOpen.value) return;
  if (
    rootRef.value &&
    event.target instanceof Node &&
    rootRef.value.contains(event.target)
  ) {
    return;
  }
  // 立刻收、不等任何信号。也刻意不恢复焦点、不按住滚动 —— 用户点的是别处，
  // 那一下本身就在表达「把光标放到那儿」，我们再插手只会跟他抢。
  sheetOpen.value = false;
  savedSelection = null;
  schedulePinRelease();
};

onMounted(() => {
  props.editor.on("focus", onFocus);
  props.editor.on("blur", onBlur);
  props.editor.on("transaction", bump);
  focused.value = props.editor.isFocused;
  window.addEventListener("pointerdown", onPointerDownOutside, true);
});

onBeforeUnmount(() => {
  clearTimeout(blurTimer);
  clearTimeout(unpinTimer);
  cancelAnimationFrame(holdRaf);
  // editor-header / editor-dock 里的状态是模块级的，卸载时必须归还，否则会漏到别的页面
  setEditorHeaderHold(false);
  setDockHeight(0);
  if (bumpFrame) cancelAnimationFrame(bumpFrame);
  props.editor.off("focus", onFocus);
  props.editor.off("blur", onBlur);
  props.editor.off("transaction", bump);
  window.removeEventListener("pointerdown", onPointerDownOutside, true);
});

/** 当前该显示的分段（表格段仅在单元格内出现） */
const segments = computed(() => {
  void revision.value;
  return TOOLBAR_SEGMENTS.filter((s) => !s.show || s.show(props.editor));
});

const isActive = (item: ToolbarItem) => {
  void revision.value;
  return item.isActive?.(props.editor) ?? false;
};

const isDisabled = (item: ToolbarItem) => {
  void revision.value;
  return item.isDisabled?.(props.editor) ?? false;
};

/** 图标与文案可能随状态变化（见 ToolbarItem.iconOf / labelKeyOf） */
const iconOf = (item: ToolbarItem) => {
  void revision.value;
  return item.iconOf?.(props.editor) ?? item.icon;
};

const labelOf = (item: ToolbarItem) => {
  void revision.value;
  const key = item.labelKeyOf?.(props.editor) ?? item.labelKey;
  // blockCommands 的 tooltip 是多行的（第二行是 markdown 提示），aria-label 只取首行
  return t(key).split("\n")[0];
};

const run = (item: ToolbarItem) => {
  if (isDisabled(item)) return;
  // 同 onSheetSelect：先钉住阅读位置再动文档。这些命令内部都是 chain().focus()，
  // 而 focus 默认会把选区滚进视野；块类型切换还会改变行高，两者都会让正文位移
  holdScroll();
  item.run(props.editor);
};
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      leave-active-class="transition-transform duration-150 ease-in"
      enter-from-class="translate-y-full"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="visible"
        ref="rootRef"
        class="fixed inset-x-0 z-40 flex flex-col border-t border-border/40 bg-bg-card shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.25)]"
        :style="rootStyle"
        @mousedown="onRootMouseDown"
      >
        <!-- shrink-0：展开态容器被 top/bottom 同时钉住、高度是定的，
             工具条这一行不能被面板挤扁 -->
        <div class="flex shrink-0 items-stretch">
          <!-- 固定区：不参与横向滚动。
               - 「+」是 `/` 命令的替身、最高频入口，不能要求用户先滑动才够得着；
               - 链接必须留在这里还有个硬原因：它的 URL 输入弹层有 min-w-72，
                 而右侧滚动区是 overflow-x:auto —— 那是个裁剪上下文，弹层放进去
                 会被直接切掉。 -->
          <div
            class="flex shrink-0 items-center gap-0.5 border-r border-border/30 px-1.5 py-1.5"
          >
            <!-- 按钮统一「定尺寸容器 + w-full/h-full」，同 PostEditorStatusBar。
                 不能直接给 ButtonSecondary 写 h-10：它的基础样式带 min-h-full，
                 在被 items-stretch 拉高的容器里那条会盖过显式高度，按钮就被
                 抻成行高那么高的长方形。 -->
            <div class="h-10 w-10">
              <ButtonSecondary
                class="h-full! w-full! p-0!"
                :is-active="sheetOpen"
                :aria-label="
                  t('views.admin.PostEditor.content.mobileToolbar.insert')
                "
                @click="sheetOpen ? closeSheet() : openSheet()"
              >
                <component :is="sheetOpen ? X : Plus" class="h-5 w-5" />
              </ButtonSecondary>
            </div>

            <MobileLinkButton :editor="editor" />
          </div>

          <!-- 其余分段横向滚动（Notion / 飞书 / Bear 都是这个形态）：
               按钮数量随上下文变化，换行会让工具条高度跳动，滚动不会 -->
          <div
            class="flex flex-1 items-center gap-0.5 overflow-x-auto px-1.5 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <template v-for="(segment, si) in segments" :key="segment.id">
              <div
                v-if="si > 0"
                class="mx-1 h-5 w-px shrink-0 self-center bg-border/50"
              />
              <div
                v-for="item in segment.items"
                :key="item.id"
                class="h-10 w-10 shrink-0"
              >
                <ButtonSecondary
                  class="h-full! w-full! p-0!"
                  :class="
                    item.danger
                      ? 'text-red-500! hover:text-red-600!'
                      : undefined
                  "
                  :is-active="isActive(item)"
                  :disabled="isDisabled(item)"
                  :aria-label="labelOf(item)"
                  @click="run(item)"
                >
                  <component :is="iconOf(item)" class="h-5 w-5" />
                </ButtonSecondary>
              </div>
            </template>
          </div>
        </div>

        <!-- 插入面板在工具条「下方」——它顶替的是键盘的位置，不是正文的位置。
             高度不写死，靠 flex-1 吃掉「钉住的 top」到「视口底」之间的剩余空间：
             键盘退多少它就长多少，也就不必预测键盘高度。 -->
        <MobileInsertSheet
          v-if="sheetOpen"
          class="min-h-0 flex-1"
          @select="onSheetSelect"
        />
      </div>
    </Transition>
  </Teleport>
</template>
