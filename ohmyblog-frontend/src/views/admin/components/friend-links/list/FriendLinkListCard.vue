<!--
  src/views/admin/components/friend-links/list/FriendLinkListCard.vue
  友链列表项卡片
  - 展示头像（或首字占位）、站点名、域名、状态标签和申请时间
  - 支持激活状态样式（左侧色条 + 高亮背景）
-->
<script setup lang="ts">
import { computed } from "vue";
import { useLang } from "@/composables/lang.hook";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import { getFriendLinkDomain, getFriendLinkInitial } from "@/utils/friend-link";
import { formatShortTime } from "@/utils/date";
import type { FriendLinkItem } from "../types";

const props = defineProps<{
  item: FriendLinkItem;
  active?: boolean;
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
  <div
    class="group p-4 cursor-pointer transition-all duration-200 border-b border-fg-muted/10 last:border-b-0 relative"
    :class="[
      active
        ? 'bg-accent/10'
        : 'bg-transparent hover:bg-accent/5 active:bg-accent/10',
    ]"
  >
    <!-- 激活态左侧标识条 -->
    <div v-if="active" class="absolute left-0 top-0 bottom-0 w-1 bg-accent" />

    <!-- 头部：头像 + 名称 + 时间 -->
    <div class="flex items-center gap-3">
      <!-- 圆形头像或首字占位 -->
      <div
        class="shrink-0 w-9 h-9 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center"
      >
        <img
          v-if="item.avatarUrl"
          :src="item.avatarUrl"
          :alt="item.name"
          class="w-full h-full object-cover"
        />
        <span v-else class="text-sm font-bold text-accent">{{ initial }}</span>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-1 mb-0.5">
          <span
            class="text-sm font-semibold truncate transition-colors"
            :class="active ? 'text-accent' : 'text-fg group-hover:text-accent'"
          >
            {{ item.name }}
          </span>
          <span class="text-[10px] font-medium text-fg-subtle shrink-0">
            {{ formatShortTime(item.createdAt) }}
          </span>
        </div>
        <!-- 域名（左）+ 状态标签（右） -->
        <div class="flex items-center justify-between gap-1 mt-0.5">
          <p class="text-[11px] font-mono text-fg-subtle truncate">
            {{ domain }}
          </p>
          <BaseTag
            :type="statusTagType"
            :show-icon="false"
            class="uppercase tracking-wide shrink-0"
          >
            {{ t(`views.friendLinks.status.${item.status}`) }}
          </BaseTag>
        </div>
      </div>
    </div>
  </div>
</template>
