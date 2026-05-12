<!-- src/components/base/search/SearchResultItem.vue -->
<!-- 搜索结果单条列表项：渲染标题与摘要，并对命中关键词进行高亮 -->
<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { RiArrowRightSLine } from "@remixicon/vue";
import type { PostListItem } from "@/api/post.api";

const props = defineProps<{
  /** 文章数据 */
  post: PostListItem;
  /** 当前搜索关键词，用于高亮匹配文字 */
  query: string;
}>();

const emit = defineEmits<{
  (e: "navigate", slug: string | null): void;
}>();

const { t } = useI18n();

/** 将文本按关键词分段，供模板高亮渲染（无 XSS 风险，不使用 v-html） */
const highlightParts = (text: string, keyword: string) => {
  if (!keyword.trim() || !text) return [{ text, match: false }];
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts: { text: string; match: boolean }[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push({ text: text.slice(lastIndex, m.index), match: false });
    parts.push({ text: m[0], match: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), match: false });
  return parts;
};
</script>

<template>
  <button
    type="button"
    class="group w-full text-left px-4 py-3.5 hover:bg-bg-muted/60 transition-colors border-b border-fg-subtle/5 last:border-0 cursor-pointer flex items-start gap-2"
    @mousedown.prevent
    @click="emit('navigate', post.slug)"
  >
    <div class="flex-1 min-w-0">
      <!-- 标题：高亮匹配关键词 -->
      <p class="text-sm font-semibold text-fg line-clamp-1 leading-snug">
        <template
          v-for="(part, i) in highlightParts(post.title || t('components.base.search.HeaderSearch.untitled'), query)"
          :key="i"
        >
          <span v-if="part.match" class="text-accent">{{ part.text }}</span>
          <span v-else>{{ part.text }}</span>
        </template>
      </p>
      <!-- 摘要：高亮匹配关键词，最多 2 行 -->
      <p
        v-if="post.excerpt || post.contentText"
        class="text-xs text-fg-muted mt-1 line-clamp-2 leading-relaxed"
      >
        <template
          v-for="(part, i) in highlightParts((post.excerpt || post.contentText?.slice(0, 120)) ?? '', query)"
          :key="i"
        >
          <span v-if="part.match" class="text-accent font-medium">{{ part.text }}</span>
          <span v-else>{{ part.text }}</span>
        </template>
      </p>
    </div>
    <!-- 悬停时显示右箭头 -->
    <RiArrowRightSLine
      class="w-4 h-4 shrink-0 mt-0.5 text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity"
    />
  </button>
</template>
