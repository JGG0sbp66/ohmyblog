<!-- src/views/admin/components/posts/table/cells/PostTimeCell.vue -->
<!--
  文章列表时间单元格
  - 根据文章状态智能选择展示的时间字段：
      · published → publishedAt（发布时间）
      · deleted   → deletedAt（移入回收站时间）
      · 其他      → updatedAt（最近修改时间）
  - 上方显示时间类型标签（发布于 / 删除于 / 修改于），下方显示格式化日期
-->
<script setup lang="ts">
import { computed } from "vue";
import { useLang } from "@/composables/lang.hook";
import type { PostListItem } from "@/api/post.api";

const props = defineProps<{
  post: PostListItem;
}>();

const { t } = useLang();

/** 日期格式化器，使用浏览器本地语言环境 */
const fmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 根据状态选取对应的时间字段 */
const date = computed((): Date | null => {
  if (props.post.status === "published" && props.post.publishedAt)
    return new Date(props.post.publishedAt);
  if (props.post.status === "deleted" && props.post.deletedAt)
    return new Date(props.post.deletedAt);
  return props.post.updatedAt ? new Date(props.post.updatedAt) : null;
});

/** 时间类型前缀标签 */
const label = computed((): string => {
  if (props.post.status === "published" && props.post.publishedAt)
    return t("views.admin.Posts.table.timeLabel.published");
  if (props.post.status === "deleted" && props.post.deletedAt)
    return t("views.admin.Posts.table.timeLabel.deleted");
  return t("views.admin.Posts.table.timeLabel.updated");
});

const formatted = computed(() => (date.value ? fmt.format(date.value) : "—"));
</script>

<template>
  <div class="w-32 shrink-0 flex flex-col text-xs text-fg-muted">
    <span class="text-fg-subtle">{{ label }}</span>
    <span>{{ formatted }}</span>
  </div>
</template>
