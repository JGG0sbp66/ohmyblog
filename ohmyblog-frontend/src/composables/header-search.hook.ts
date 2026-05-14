// src/composables/header-search.hook.ts
import { ref, computed, watch, watchEffect, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useInfiniteScroll } from "@vueuse/core";
import { getPublicPostList } from "@/api/post.api";
import type { PostListItem } from "@/api/post.api";

/** 每页加载条数 */
const PAGE_SIZE = 5;

/**
 * Header 搜索栏逻辑 Hook
 *
 * 封装了：展开/收起动画状态、实时搜索（防抖）、分页与无限滚动、
 * 结果下拉面板可见性同步、导航跳转及防竞态处理。
 */
export function useHeaderSearch() {
  const router = useRouter();

  // ── DOM 模板引用 ──────────────────────────────────────────
  const containerRef = ref<HTMLElement | null>(null); // 整个搜索组件的根容器
  const inputRef = ref<HTMLInputElement | null>(null); // 文本输入框
  const scrollContainerRef = ref<HTMLElement | null>(null); // 结果列表滚动容器（用于无限滚动）

  // ── 展开 / 收起状态 ────────────────────────────────────────
  const hovered = ref(false);
  const focused = ref(false);
  /** hover 或 focus 任意一个为真时搜索栏展开 */
  const isExpanded = computed(() => hovered.value || focused.value);

  // ── 搜索 & 分页状态 ────────────────────────────────────────
  const query = ref("");
  const results = ref<PostListItem[]>([]);
  const loading = ref(false);
  const page = ref(1);
  const isFinished = ref(false);

  // BasePop 需要 writable ref 做 v-model，不能直接用 computed
  const isDropdownOpen = ref(false);

  // 输入框聚焦 + 有内容（或加载中）时才展示下拉面板
  watchEffect(() => {
    isDropdownOpen.value =
      focused.value &&
      (loading.value ||
        results.value.length > 0 ||
        query.value.trim().length > 0);
  });

  // ── 搜索请求 ───────────────────────────────────────────────
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  /** 防竞态：每次发起请求递增，旧请求响应回来后若 id 不匹配则丢弃 */
  let requestId = 0;

  /**
   * 拉取搜索结果
   * @param reset true = 关键词变更，重置到第 1 页；false = 滚动加载下一页
   */
  const fetchMore = async (reset = false) => {
    if (!query.value.trim()) return;
    if (!reset && (loading.value || isFinished.value)) return;
    const thisId = ++requestId;
    loading.value = true;
    if (reset) {
      results.value = [];
      page.value = 1;
      isFinished.value = false;
    }
    try {
      const data = await getPublicPostList({
        page: page.value,
        pageSize: PAGE_SIZE,
        keyword: query.value,
      });
      if (thisId !== requestId) return; // 旧请求，丢弃
      const newItems: PostListItem[] = (data as any)?.list ?? [];
      const total: number = (data as any)?.total ?? 0;
      if (reset) {
        results.value = newItems;
      } else {
        results.value.push(...newItems);
      }
      // 判断是否已加载全部数据
      if (results.value.length >= total || newItems.length < PAGE_SIZE) {
        isFinished.value = true;
      } else {
        page.value++;
      }
    } catch {
      if (thisId === requestId && reset) results.value = [];
    } finally {
      if (thisId === requestId) loading.value = false;
    }
  };

  // 滚动到距底部 50px 时自动加载下一页
  useInfiniteScroll(
    scrollContainerRef,
    () => {
      if (!isFinished.value && !loading.value) fetchMore();
    },
    { distance: 50 },
  );

  // 关键词变更：防抖 300ms 后重置并重新搜索
  watch(query, (val) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!val.trim()) {
      results.value = [];
      loading.value = false;
      page.value = 1;
      isFinished.value = false;
      return;
    }
    loading.value = true; // 立即进入 loading，避免下拉面板闪烁关闭
    debounceTimer = setTimeout(() => fetchMore(true), 300);
  });

  // 搜索栏展开时自动聚焦输入框；收起时清空状态
  watch(isExpanded, async (val) => {
    if (val) {
      await nextTick();
      inputRef.value?.focus();
    } else {
      query.value = "";
      results.value = [];
    }
  });

  // ── 事件处理 ───────────────────────────────────────────────

  /** focusout：焦点移出整个组件时收起搜索栏 */
  const onFocusOut = (e: FocusEvent) => {
    if (!containerRef.value?.contains(e.relatedTarget as Node)) {
      focused.value = false;
    }
  };

  /**
   * 跳转到文章详情页
   * 必须先 blur 输入框，否则 DOM focus 状态与 focused ref 不同步，
   * 导致下次展开时 focusin 不重新触发。
   */
  const navigateTo = (slug: string | null) => {
    if (!slug) return;
    inputRef.value?.blur();
    focused.value = false;
    hovered.value = false;
    router.push({ name: "post", params: { slug } });
  };

  /** Escape 键收起搜索栏 */
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") inputRef.value?.blur();
  };

  return {
    containerRef,
    inputRef,
    scrollContainerRef,
    hovered,
    focused,
    isExpanded,
    isDropdownOpen,
    query,
    results,
    loading,
    onFocusOut,
    navigateTo,
    onKeydown,
  };
}
