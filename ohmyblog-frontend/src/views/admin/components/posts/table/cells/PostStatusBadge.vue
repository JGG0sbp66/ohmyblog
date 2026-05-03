<!-- src/views/admin/components/posts/table/cells/PostStatusBadge.vue -->
<!--
  文章状态徽标
  - 根据 status 显示对应颜色的 BaseTag
  - 颜色映射由 postStatusColors.ts 统一维护，与筛选器共用同一套色值
  - 文案取自 i18n，与筛选器 Tab 的文案保持一致
-->
<script setup lang="ts">
import { computed } from "vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import { useLang } from "@/composables/lang.hook";
import type { TPostStatus } from "@server/db/constants/post.constants";
import { POST_STATUS_COLORS } from "../../postStatusColors";

const props = defineProps<{
  status: TPostStatus;
}>();

const { t } = useLang();

/** 各状态对应的 i18n key，复用筛选器文案 */
const labelKeys: Record<TPostStatus, string> = {
  published: "views.admin.Posts.filter.published",
  draft: "views.admin.Posts.filter.draft",
  archived: "views.admin.Posts.filter.archived",
  deleted: "views.admin.Posts.filter.deleted",
};

const colorClass = computed(() => POST_STATUS_COLORS[props.status]);
const label = computed(() => t(labelKeys[props.status]));
</script>

<template>
  <BaseTag :show-icon="false" :class="colorClass">
    {{ label }}
  </BaseTag>
</template>
