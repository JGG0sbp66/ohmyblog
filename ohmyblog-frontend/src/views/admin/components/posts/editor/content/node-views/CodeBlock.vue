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
import {
  computed,
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { onClickOutside } from "@vueuse/core";
import { useLang } from "@/composables/lang.hook";
import CodeBlockActions from "@/components/common/code/CodeBlockActions.vue";
import {
  listAvailableLanguages,
  resolveLanguageIcon,
  preloadLanguageIcons,
  formatLanguageLabel,
  countCodeLines,
  syncLineNumberHeights,
  detectLanguage,
} from "@/composables/code-block";
import { useAnchoredPosition } from "../composables/use-anchored-position";

const props = defineProps(nodeViewProps);
const { t } = useLang();

// ─── 语言下拉 ────────────────────────────────────────────────────────────────
// 输入框作为搜索 trigger：focus / 键入时显示候选列表，typo 即时反馈
// 而不是裸输入字符串（之前版本：错一个字母整个高亮失效）
//
// 展示名与语法名分离：输入框与候选列表显示 "TypeScript"，attrs 里存的始终是
// 语法名 "typescript"（见 composables/code-block/labels.ts）。
// 用户键入期间输入框保留原始文本（作为搜索词），不碰 attrs —— 提交只发生在
// 回车 / 点选 / 失焦三个时机（原因见 onLangInput 注释）。
//
// 弹层 Teleport 到 body：代码块容器有 overflow:hidden（为了 header 圆角），
// 内部 absolute 定位的下拉会被裁掉；fixed 定位绕开父级 overflow
const allLanguages = listAvailableLanguages();
const langInput = ref<string>(
  formatLanguageLabel(props.node.attrs.language ?? ""),
);
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

/** 过滤候选：前缀优先 → 包含匹配；空 query 时全量。
 *  语法名与展示名都参与匹配，因此 "objectivec" 和 "Objective-C" 都能搜到。 */
const filteredLanguages = computed<string[]>(() => {
  const q = langInput.value.trim().toLowerCase();
  if (!q) return allLanguages;
  const prefix: string[] = [];
  const include: string[] = [];
  for (const lang of allLanguages) {
    const label = formatLanguageLabel(lang).toLowerCase();
    if (lang.startsWith(q) || label.startsWith(q)) prefix.push(lang);
    else if (lang.includes(q) || label.includes(q)) include.push(lang);
  }
  return [...prefix, ...include];
});

const commitLanguage = (lang: string) => {
  // 输入框显示展示名，attrs 存语法名
  langInput.value = formatLanguageLabel(lang);
  props.updateAttributes({ language: lang });
  langPickerOpen.value = false;
};

const onLangFocus = () => {
  langPickerOpen.value = true;
  selectedIndex.value = 0;
  nextTick(updatePopupPosition);
};

/** 失焦提交：敲完整的语言名（语法名 / 展示名 / 别名均可）归一化成语法名
 *  写入 attrs；半截或拼错的丢弃、回弹当前值。校验这步不能省：残缺值一旦
 *  落库，会随 contentHtml 存成 class="language-ty"，且编辑器每次渲染都对它
 *  highlightAuto（对全部语法评分）。没设语言时用识别结果回填，保持
 *  header 始终有可读的语言名 */
const onLangBlur = () => {
  const typed = langInput.value.trim().toLowerCase();
  const slug = allLanguages.includes(typed)
    ? typed
    : (allLanguages.find(
        (lang) => formatLanguageLabel(lang).toLowerCase() === typed,
      ) ?? null);
  if (slug) {
    if (slug !== props.node.attrs.language) {
      props.updateAttributes({ language: slug });
    }
    langInput.value = formatLanguageLabel(slug);
  } else {
    langInput.value = formatLanguageLabel(
      props.node.attrs.language || detected.value || "",
    );
  }
};

const onLangInput = (event: Event) => {
  langInput.value = (event.target as HTMLInputElement).value;
  langPickerOpen.value = true;
  selectedIndex.value = 0;
  // 只更新搜索词，不碰 attrs：updateAttributes 会产生 docChanged 事务，
  // Tiptap 的 lowlight 插件借此对文档里全部代码块重跑高亮；而键入中的
  // 残缺语言名（"t"、"ty"）不在语法集内，每次都会退化成 highlightAuto
  // 对全部已注册语法逐一评分 —— 长代码块每键一次必然卡顿。生效推迟到
  // 回车 / 点选 / 失焦（见 onLangBlur）。
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
});

// ─── 语言图标 ────────────────────────────────────────────────────────────────
// 取代原先 header 左侧的 MacOS 三圆点装饰。未收录的语言会拿到兜底图标，
// 因此图标位永远有内容，输入过程中不会因图标时有时无导致 header 抖动。
//
// 图标表按需加载（见 composables/code-block/icons.ts）：本组件挂载即意味着
// 编辑器里存在代码块，此时拉表最合适；表就绪前先渲染兜底图标。
const iconsReady = ref(false);
onMounted(() => {
  void preloadLanguageIcons().then(() => {
    iconsReady.value = true;
  });
});

// 语言自动识别：语言没设置时，CodeBlockLowlight 内部会 highlightAuto 兜底
// 上色。这里把识别出的真实语法名同步到 header 输入框，避免只显示 Text；
// 自动填入本身不写 attrs，但产品意图是把它当作可确认的建议值：用户让输入框
// focus 后再 blur，即视为确认当前值，onLangBlur 会将该真实值持久化。
// 用户也可以像手打的一样继续删改（改成 IN 重新搜）、回车或点选确认。
//
// 填充阶段只改输入框显示值、不直接回写 attrs：启发式仍可能猜错（见
// detectLanguage 注释）；在用户通过 focus → blur / 回车 / 点选确认前，不赋予
// 持久语义。
const detected = ref<string | null>(null);
let detectTimer: ReturnType<typeof setTimeout> | null = null;

// 防抖：自动检测要拿内容对 ~100 种语法全部评分，不便宜；
// 输入停顿后再跑，避免每次击键都全量评分。200ms 大于正常击键间隔
// （50~150ms）足够合并击键，粘贴这类一次性大变更也几乎无感。
const refreshDetected = () => {
  if (detectTimer) clearTimeout(detectTimer);
  detectTimer = setTimeout(() => {
    detected.value = props.node.attrs.language
      ? null
      : detectLanguage(props.node.textContent);
    // 识别结果填进输入框：用户正在编辑时不覆盖（焦点在输入框内说明
    // 里面是他自己敲的内容，比猜测值优先）
    if (
      !props.node.attrs.language &&
      document.activeElement !== langInputRef.value
    ) {
      langInput.value = formatLanguageLabel(detected.value ?? "");
    }
  }, 200);
};

watch(() => props.node.textContent, refreshDetected);
watch(
  () => props.node.attrs.language,
  () => {
    // 显式选中后清掉检测结果：header 与代码区都以显式语言为准
    detected.value = null;
    if (detectTimer) clearTimeout(detectTimer);
  },
);
onMounted(refreshDetected);
onBeforeUnmount(() => {
  if (detectTimer) clearTimeout(detectTimer);
});

const languageIcon = computed(() => {
  void iconsReady.value; // 建立依赖：图标表加载完成后重算
  const language = props.node.attrs.language ?? "";
  // 未设语言时用识别结果的图标，与代码区正在显示的自动检测配色对应
  return resolveLanguageIcon(language || detected.value || "");
});

// ─── 行号 ────────────────────────────────────────────────────────────────────
const lineCount = computed(() => countCodeLines(props.node.textContent));

// ─── 软换行开关 ──────────────────────────────────────────────────────────────
// 默认关闭：代码默认横向滚动，一个逻辑行恒等于一个视觉行，行号靠 CSS 定高即可对齐，
// 零测量开销；这也与阅读端未开启换行时的排版一致。
//
// 打开后长行软换行，行号必须改为按每行实测高度撑开（见 composables/code-block/line-numbers.ts），
// 否则行号只前进一格而代码占了多行，会整体错位 —— 这正是加开关时真正要解决的问题。
//
// 该状态刻意只存在于组件内、不写进 node.attrs：它纯属阅读姿势，
// 写进文档就会进入 contentHtml（RSS 源，见 api/post.api.ts 注释），污染正文语义。
const wrap = ref(false);
const contentRef = ref<HTMLElement | null>(null);

const codeEl = () =>
  contentRef.value?.querySelector<HTMLElement>("pre code") ?? null;
const lineNumbersEl = () =>
  contentRef.value?.querySelector<HTMLElement>(".line-numbers") ?? null;

/** 重新对齐行号列；关闭换行时会清掉内联高度、交还 CSS 定高 */
const resync = () =>
  syncLineNumberHeights(codeEl(), lineNumbersEl(), wrap.value);

// 内容变化、行数变化、开关切换都要重量一次（换行边界会随之移动）
watch(
  [wrap, lineCount, () => props.node.textContent],
  () => void nextTick(resync),
);

// 容器宽度变化会改变换行位置：窗口缩放、侧栏展开、表格列宽调整都会触发。
//
// 只认宽度：换行态下重量会改写行号格子高度 → 容器高度变化 → observer 再次触发，
// 若不加这道闸就是一个自反馈循环（浏览器会报 ResizeObserver loop）。
// 高度变化对换行位置没有影响，忽略即可。
let widthObserver: ResizeObserver | null = null;
let lastWidth = -1;

onMounted(() => {
  void nextTick(() => {
    resync();
    const pre = contentRef.value?.querySelector("pre");
    if (pre && typeof ResizeObserver !== "undefined") {
      widthObserver = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? -1;
        if (Math.abs(width - lastWidth) < 0.5) return;
        lastWidth = width;
        resync();
      });
      widthObserver.observe(pre);
    }
  });
  // 等宽字体晚于首帧就绪时行高会变，字体落地后再校一次
  void document.fonts?.ready.then(() => resync());
});

onBeforeUnmount(() => {
  widthObserver?.disconnect();
  widthObserver = null;
});
</script>

<template>
  <node-view-wrapper class="code-block-container" :class="{ 'is-wrap': wrap }">
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
          placeholder="Text"
          spellcheck="false"
          autocomplete="off"
          @focus="onLangFocus"
          @blur="onLangBlur"
          @input="onLangInput"
          @keydown="onLangKeydown"
        />
      </div>

      <!-- 换行开关 + 复制按钮：与忘记密码兜底页共用同一个组件 -->
      <CodeBlockActions v-model:wrap="wrap" :text="node.textContent" />
    </div>

    <div ref="contentRef" class="code-block-content">
      <!-- 行号列：换行模式下每格高度由 syncLineNumberHeights 按实测值写入 -->
      <div class="line-numbers" contenteditable="false">
        <span v-for="n in lineCount" :key="n">{{ n }}</span>
      </div>
      <!--
        white-space 必须在这里以 prop 形式给，不能只写在 code-block.css。

        @tiptap/vue-3 的 NodeViewContent 会给内容元素打上内联样式
        style="white-space: pre-wrap"，内联样式压过任何非 !important 的样式表规则，
        因此 CSS 侧无论怎么写 .tiptap pre code { white-space: pre } 都不生效。
        把 style 作为 prop 传下去，Vue 合并时以父级传入的为准，才能真正覆盖。

        默认取 pre（不换行）：逻辑行与视觉行 1:1，行号靠 CSS 定高对齐，超长行走
        pre 的 overflow-x 横向滚动；这也与阅读端默认排版一致，避免「编辑时换行、
        发布后滚动」同一段代码两种样子。开关打开后切到 pre-wrap，
        行号改由实测高度撑开。
      -->
      <pre><node-view-content
        as="code"
        :style="{ whiteSpace: wrap ? 'pre-wrap' : 'pre' }"
      /></pre>
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
          {{ formatLanguageLabel(lang) }}
        </button>
      </div>
    </Teleport>
  </node-view-wrapper>
</template>
