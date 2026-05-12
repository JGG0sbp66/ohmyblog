<!--
  src/views/admin/components/friend-links/detail/FriendLinkHeaderInfo.vue
  友链详情头部元数据展示组件
  - 圆形头像（无头像时显示首字占位）
  - 站点名称 + 状态标签
  - 可点击的域名链接
-->
<script setup lang="ts">
import { computed } from "vue";
import { useLang } from "@/composables/lang.hook";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import { getFriendLinkDomain, getFriendLinkInitial } from "@/utils/friend-link";
import type { FriendLinkItem } from "../types";

const props = defineProps<{
  item: FriendLinkItem;
}>();

const { t } = useLang();

const domain = computed(() => getFriendLinkDomain(props.item.url));
const initial = computed(() => getFriendLinkInitial(props.item.name));

/** 状态 → BaseTag type 映射 */
const statusTagType = computed(() => {
  const map: Record<string, "warn" | "success" | "error"> = {
    pending: "warn",
    approved: "success",
    rejected: "error",
  };
  return map[props.item.status] ?? "info";
});
</script>

<template>
  <div class="p-6 border-b border-border/50 flex items-start gap-4">
    <!-- 圆形头像 / 首字占位 -->
    <div
      class="shrink-0 w-14 h-14 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center"
    >
      <img
        v-if="item.avatarUrl"
        :src="item.avatarUrl"
        :alt="item.name"
        class="w-full h-full object-cover"
      />
      <span v-else class="text-xl font-bold text-accent">{{ initial }}</span>
    </div>

    <!-- 名称 + 域名（左）/ 状态标签（右上角） -->
    <div class="flex-1 min-w-0 flex items-start justify-between gap-2">
      <div class="min-w-0">
        <h1 class="text-lg font-bold text-fg truncate">{{ item.name }}</h1>
        <a
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs font-mono text-fg-subtle hover:text-accent transition-colors truncate block mt-0.5"
        >
          {{ domain }}
        </a>
      </div>
      <BaseTag :type="statusTagType" :show-icon="false" class="uppercase tracking-wide shrink-0 mt-0.5">
        {{ t(`views.friendLinks.status.${item.status}`) }}
      </BaseTag>
    </div>
  </div>
</template>
