<!-- src/views/main/components/archive/ArchiveYearGroup.vue -->
<script setup lang="ts">
import { useLang } from "@/composables/lang.hook";
import ArchivePostItem from "./ArchivePostItem.vue";

const { t } = useLang();

interface ArchivePost {
  title: string;
  slug: string | null;
  publishedAt: Date | string | null;
  tags: string[];
}

defineProps<{
  year: number;
  posts: ArchivePost[];
}>();
</script>

<template>
  <div>
    <!-- 年份行 -->
    <div class="flex flex-row w-full items-center h-15">
      <!-- 年份数字 -->
      <div
        class="w-[15%] md:w-[10%] text-2xl font-bold text-right text-fg/75 select-none"
      >
        {{ year }}
      </div>
      <!-- 空心圆点（主题色轮廓） -->
      <div class="w-[15%] md:w-[10%] flex justify-center">
        <div class="year-dot h-3 w-3 rounded-full" />
      </div>
      <!-- 文章数 -->
      <div class="w-[70%] md:w-[80%] text-left text-fg-muted">
        {{ posts.length }} {{ t("views.main.archive.postsCount") }}
      </div>
    </div>

    <!-- 文章条目 -->
    <ArchivePostItem
      v-for="post in posts"
      :key="post.slug ?? post.title"
      :title="post.title"
      :slug="post.slug"
      :published-at="post.publishedAt"
      :tags="post.tags"
    />
  </div>
</template>

<style scoped>
.year-dot {
  background: transparent;
  outline: 3px solid var(--theme-accent);
  outline-offset: -2px;
}
</style>
