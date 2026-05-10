<!-- src/components/base/tag/PostMeta.vue -->
<script setup lang="ts">
import { Calendar, Hash } from "lucide-vue-next";

defineProps<{
  /** 已格式化的日期字符串，如 "2024-05-01" */
  date?: string;
  /** 标签列表，最多展示 maxTags 条 */
  tags?: string[];
  /** 最大显示标签数，默认 3 */
  maxTags?: number;
}>();
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <!-- 发布日期 -->
    <div
      v-if="date"
      class="flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-medium px-2 py-1 rounded-md"
    >
      <Calendar class="w-3.5 h-3.5 shrink-0" />
      <span>{{ date }}</span>
    </div>

    <!-- 标签 -->
    <div
      v-if="tags && tags.length > 0"
      class="flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-medium px-2 py-1 rounded-md"
    >
      <Hash class="w-3.5 h-3.5 shrink-0" />
      <span>{{ (tags ?? []).slice(0, maxTags ?? 3).join(" / ") }}</span>
    </div>
  </div>
</template>
