<!--
  src/views/admin/components/friend-links/detail/FriendLinkDetailBody.vue
  友链详情内容正文组件
  - 展示：简介、标签、联系邮箱、拒绝原因、申请/入驻时间
  纯展示组件，无副作用
-->
<script setup lang="ts">
import { useLang } from "@/composables/lang.hook";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import { formatDateTime } from "@/utils/date";
import FriendLinkCard from "@/views/main/components/friends/FriendLinkCard.vue";
import type { FriendLinkItem } from "../types";

defineProps<{
  item: FriendLinkItem;
}>();

const { t } = useLang();
</script>

<template>
  <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
    <!-- 简介 -->
    <div v-if="item.description">
      <div class="text-[10px] font-bold uppercase tracking-wider text-fg-subtle mb-1">
        {{ t("views.friendLinks.detail.description") }}
      </div>
      <p class="text-sm text-fg leading-relaxed">{{ item.description }}</p>
    </div>

    <!-- 标签 -->
    <div v-if="item.tags && item.tags.length > 0">
      <div class="text-[10px] font-bold uppercase tracking-wider text-fg-subtle mb-1">
        {{ t("views.friendLinks.detail.tags") }}
      </div>
      <div class="flex flex-wrap gap-1.5">
        <BaseTag
          v-for="tag in item.tags"
          :key="tag"
          type="primary"
          :show-icon="false"
        >
          {{ tag }}
        </BaseTag>
      </div>
    </div>

    <!-- 联系邮箱 -->
    <div v-if="item.applicantEmail">
      <div class="text-[10px] font-bold uppercase tracking-wider text-fg-subtle mb-1">
        {{ t("views.friendLinks.detail.applicantEmail") }}
      </div>
      <p class="text-sm text-fg font-mono">{{ item.applicantEmail }}</p>
    </div>

    <!-- 拒绝原因（仅 rejected 时显示） -->
    <div v-if="item.status === 'rejected' && item.rejectReason">
      <div class="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1">
        {{ t("views.friendLinks.detail.rejectReason") }}
      </div>
      <p class="text-sm text-fg-muted">{{ item.rejectReason }}</p>
    </div>

    <!-- 时间信息 -->
    <div class="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
      <div>
        <div class="text-[10px] font-bold uppercase tracking-wider text-fg-subtle mb-1">
          {{ t("views.friendLinks.detail.appliedAt") }}
        </div>
        <p class="text-xs text-fg">{{ formatDateTime(item.createdAt) }}</p>
      </div>
      <div v-if="item.joinedAt">
        <div class="text-[10px] font-bold uppercase tracking-wider text-fg-subtle mb-1">
          {{ t("views.friendLinks.detail.joinedAt") }}
        </div>
        <p class="text-xs text-fg">{{ formatDateTime(item.joinedAt) }}</p>
      </div>
    </div>

    <!-- 前台预览 -->
    <div class="pt-2 border-t border-border/30">
      <div class="text-[10px] font-bold uppercase tracking-wider text-fg-subtle mb-2">
        {{ t("views.friendLinks.detail.preview") }}
      </div>
      <div class="max-w-xs mx-auto">
        <FriendLinkCard :link="item" />
      </div>
    </div>
  </div>
</template>
