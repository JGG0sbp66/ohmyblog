<!-- src/views/admin/components/posts/table/cells/PostStatusBadge.vue -->
<!--
  文章状态徽标
  - 根据 status 显示对应颜色的 BaseTag
  - 颜色映射由 postStatusColors.ts 统一维护，与筛选器共用同一套色值
  - 文案取自 i18n，与筛选器 Tab 的文案保持一致
-->
<script lang="ts">
import type { TPostStatus } from "@server/db/constants/post.constants";

/** 各状态对应的 Tailwind 颜色类 */
export const POST_STATUS_COLORS: Record<TPostStatus | "all", string> = {
  all: "bg-accent/15 text-accent",
  published: "bg-green-500/15 text-green-600",
  draft: "bg-amber-400/20 text-amber-500",
  archived: "bg-purple-500/15 text-purple-500",
  deleted: "bg-red-500/15 text-red-500",
};

/** 各状态对应的 i18n key */
export const POST_STATUS_LABEL_KEYS: Record<TPostStatus, string> = {
  published: "views.admin.Posts.filter.published",
  draft: "views.admin.Posts.filter.draft",
  archived: "views.admin.Posts.filter.archived",
  deleted: "views.admin.Posts.filter.deleted",
};
</script>

<script setup lang="ts">
import { computed } from "vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import { useLang } from "@/composables/lang.hook";

const props = defineProps<{
  status: TPostStatus;
}>();

const { t } = useLang();

const colorClass = computed(() => POST_STATUS_COLORS[props.status]);
const label = computed(() => t(POST_STATUS_LABEL_KEYS[props.status]));
</script>

<template>
  <BaseTag :show-icon="false" :class="colorClass">
    {{ label }}
  </BaseTag>
</template>
