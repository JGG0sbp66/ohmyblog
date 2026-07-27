<!-- src/views/admin/components/posts/editor/content/node-views/CodeBlock.vue -->
<!--
  NodeView: 代码块节点的 Vue 定制渲染组件
  - header：左侧语言图标 + 语言下拉（含搜索过滤），右侧常驻复制按钮
  - 行号列：根据文本内容实时计算行数，与代码行严格等高对齐
  - 内容区：NodeViewContent 渲染 ProseMirror 可编辑代码区

  语法高亮、语言清单、语言图标、行数计算均取自 @/composables/code-block，
  与前台阅读端（enhance-code-blocks.ts）同源 —— 两端 DOM 各写一份，但逻辑只有一份。
-->
<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from "@tiptap/vue-3";
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import { onClickOutside } from "@vueuse/core";
import { Copy, Check } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import {
  listAvailableLanguages,
  resolveLanguageIcon,
  countCodeLines,
  COPY_FEEDBACK_MS,
} from "@/composables/code-block";
import { useAnchoredPosition } from "../composables/use-anchored-position";

const props = defineProps(nodeViewProps);
const { t } = useLang();

// ─── 语言下拉 ────────────────────────────────────────────────────────────────
// 输入框作为搜索 trigger：focus / 键入时显示候选列表，typo 即时反馈
// 而不是裸输入字符串（之前版本：错一个字母整个高亮失效）
//
// 弹层 Teleport 到 body：代码块容器有 overflow:hidden（为了 header 圆角），
// 内部 absolute 定位的下拉会被裁掉；fixed 定位绕开父级 overflow
const allLanguages = listAvailableLanguages();
const langInput = ref<string>(props.node.attrs.language ?? "");
const langPickerOpen = ref(false);
const selectedIndex = ref(0);
const langInputRef = ref<HTMLInputElement | null>(null);
const langPopupRef = ref<HTMLElement | null>(null);

/**
 * 语言下拉位置：贴 input 下方、左对齐 input 左沿，超出视口则 clamp。
 * 复用编辑器统一的浮层智能定位逻辑（见 useAnchoredPosition）；
 * 该下拉始终向下展开，故关闭翻转（flip:false）。
 */
const { position: popupPosition, update: updatePopupPosition } =
  useAnchoredPosition({
    getAnchorRect: () => langInputRef.value?.getBoundingClientRect() ?? null,
    getPanel: () => langPopupRef.value,
    gap: 4,
    align: "start",
    flip: false,
  });

/** 合并定位坐标与固定最小宽度，供模板 style 绑定 */
const popupStyle = computed(() => ({
  top: `${popupPosition.value.top}px`,
  left: `${popupPosition.value.left}px`,
  minWidth: "9rem",
}));

/** 过滤候选：前缀优先 → 包含匹配；空 query 时全量 */
const filteredLanguages = computed<string[]>(() => {
  const q = langInput.value.trim().toLowerCase();
  if (!q) return allLanguages;
  const prefix: string[] = [];
  const include: string[] = [];
  for (const lang of allLanguages) {
    if (lang.startsWith(q)) prefix.push(lang);
    else if (lang.includes(q)) include.push(lang);
  }
  return [...prefix, ...include];
});

const commitLanguage = (lang: string) => {
  langInput.value = lang;
  props.updateAttributes({ language: lang });
  langPickerOpen.value = false;
};

const onLangFocus = () => {
  langPickerOpen.value = true;
  selectedIndex.value = 0;
  nextTick(updatePopupPosition);
};

const onLangInput = (event: Event) => {
  langInput.value = (event.target as HTMLInputElement).value;
  langPickerOpen.value = true;
  selectedIndex.value = 0;
  // 输入即同步到 attrs，让用户即时看到（错的也写进去，反正下次选会覆盖）
  props.updateAttributes({ language: langInput.value });
  nextTick(updatePopupPosition);
};

const onLangKeydown = (event: KeyboardEvent) => {
  if (!langPickerOpen.value) return;
  const len = filteredLanguages.value.length;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (len === 0) return;
    selectedIndex.value = (selectedIndex.value + 1) % len;
    scrollSelectedIntoView();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (len === 0) return;
    selectedIndex.value = (selectedIndex.value - 1 + len) % len;
    scrollSelectedIntoView();
  } else if (event.key === "Enter") {
    event.preventDefault();
    const lang = filteredLanguages.value[selectedIndex.value];
    if (lang) commitLanguage(lang);
  } else if (event.key === "Escape") {
    langPickerOpen.value = false;
    langInputRef.value?.blur();
  }
};

const scrollSelectedIntoView = () => {
  nextTick(() => {
    const list = langPopupRef.value;
    if (!list) return;
    const item = list.children[selectedIndex.value] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  });
};

// 点击 popup 外部关闭（input 也算外部，所以排除 input）
onClickOutside(
  langPopupRef,
  () => {
    langPickerOpen.value = false;
  },
  { ignore: [langInputRef] },
);

// 滚动 / resize 时直接关闭 popup —— 跟 FloatingHandle 同策略
// 不跟随的原因：popup 是 fixed 定位 + Teleport 到 body，没有父容器可裁切，
// 跟随会让它飞出编辑器区域，比如挡住 header / sidebar
//
// 但是在 popup 内部滚动选项时（capture 阶段 scroll 事件源在 popup 内）不应关闭，
// 否则用户翻不到下面的语言项
const onScrollOrResize = (event?: Event) => {
  if (!langPickerOpen.value) return;
  const target = event?.target as Node | null;
  if (target && langPopupRef.value?.contains(target)) return;
  langPickerOpen.value = false;
};

onMounted(() => {
  window.addEventListener("scroll", onScrollOrResize, true);
  window.addEventListener("resize", onScrollOrResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScrollOrResize, true);
  window.removeEventListener("resize", onScrollOrResize);
  if (copyTimer) clearTimeout(copyTimer);
});

// ─── 语言图标 ────────────────────────────────────────────────────────────────
// 取代原先 header 左侧的 MacOS 三圆点装饰。未收录的语言会拿到兜底图标，
// 因此图标位永远有内容，输入过程中不会因图标时有时无导致 header 抖动。
const languageIcon = computed(() =>
  resolveLanguageIcon(props.node.attrs.language ?? ""),
);

// ─── 复制按钮 ────────────────────────────────────────────────────────────────
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const copyCode = async () => {
  await navigator.clipboard.writeText(props.node.textContent);
  copied.value = true;
  // 连点时重置计时，避免多个 timer 竞争导致对勾提前复原
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copied.value = false;
    copyTimer = null;
  }, COPY_FEEDBACK_MS);
};

// ─── 行号 ────────────────────────────────────────────────────────────────────
const lineCount = computed(() => countCodeLines(props.node.textContent));
</script>

<template>
  <node-view-wrapper class="code-block-container">
    <!-- header：左侧语言图标 + 语言下拉，右侧常驻复制按钮 -->
    <div class="code-block-header" contenteditable="false">
      <div class="code-block-lang">
        <!-- 图标来自生成的静态表，非用户输入，无需净化 -->
        <span class="code-block-lang-icon" v-html="languageIcon"></span>
        <input
          ref="langInputRef"
          type="text"
          :value="langInput"
          class="code-block-lang-input"
          placeholder="TEXT"
          spellcheck="false"
          autocomplete="off"
          @focus="onLangFocus"
          @input="onLangInput"
          @keydown="onLangKeydown"
        />
      </div>

      <button
        class="code-block-copy-btn"
        :class="{ copied }"
        type="button"
        :aria-label="t('views.admin.PostEditor.content.codeBlock.copy')"
        @click="copyCode"
      >
        <Check v-if="copied" :size="13" />
        <Copy v-else :size="13" />
      </button>
    </div>

    <div class="code-block-content">
      <!-- 行号列 -->
      <div class="line-numbers" contenteditable="false">
        <span v-for="n in lineCount" :key="n">{{ n }}</span>
      </div>
      <pre><node-view-content as="code" /></pre>
    </div>

    <!-- 语言候选下拉（Teleport 出去，绕开父级 overflow:hidden 裁切） -->
    <Teleport to="body">
      <div
        v-if="langPickerOpen"
        ref="langPopupRef"
        class="code-block-lang-popup"
        :style="popupStyle"
      >
        <div
          v-if="filteredLanguages.length === 0"
          class="code-block-lang-empty"
        >
          {{ t("views.admin.PostEditor.content.codeBlock.languageEmpty") }}
        </div>
        <button
          v-for="(lang, i) in filteredLanguages"
          :key="lang"
          type="button"
          class="code-block-lang-item"
          :class="{ 'is-selected': i === selectedIndex }"
          @mousedown.prevent="commitLanguage(lang)"
          @mouseenter="selectedIndex = i"
        >
          {{ lang }}
        </button>
      </div>
    </Teleport>
  </node-view-wrapper>
</template>
