<!--
  src/views/admin/components/friend-links/detail/FriendLinkDetailPanel.vue
  友链详情右侧面板（orchestrator）
  - 未选中时显示空状态引导
  - 选中后拼装：
      FriendLinkHeaderInfo  → 头部（头像、名称、状态、域名）
      FriendLinkDetailBody  → 内容正文（描述、标签、邮箱、拒绝原因、时间）
      FriendLinkDetailActions → 操作按钮 + API 逻辑 + 拒绝弹窗
-->
<script setup lang="ts">
import { Link2 } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import FriendLinkHeaderInfo from "./FriendLinkHeaderInfo.vue";
import FriendLinkDetailBody from "./FriendLinkDetailBody.vue";
import FriendLinkDetailActions from "./FriendLinkDetailActions.vue";
import type { FriendLinkItem } from "../types";

defineProps<{
  item: FriendLinkItem | null;
}>();

const emit = defineEmits<{
  /** 任意操作成功后触发，通知父组件刷新列表 */
  updated: [];
}>();

const { t } = useLang();
</script>

<template>
  <div class="h-full flex flex-col bg-bg-card">
    <!-- ── 有选中项 ────────────────────────────────────────────────────────── -->
    <template v-if="item">
      <FriendLinkHeaderInfo :item="item" />
      <FriendLinkDetailBody :item="item" />
      <FriendLinkDetailActions :item="item" @updated="emit('updated')" />
    </template>

    <!-- ── 空状态 ──────────────────────────────────────────────────────────── -->
    <div
      v-else
      class="h-full flex flex-col items-center justify-center p-12 text-center"
    >
      <div
        class="w-16 h-16 rounded-3xl bg-bg-muted flex items-center justify-center text-fg-subtle mb-4"
      >
        <Link2 class="w-8 h-8 opacity-20" />
      </div>
      <h3 class="text-lg font-bold text-fg mb-2">
        {{ t("views.friendLinks.detail.emptyTitle") }}
      </h3>
      <p class="text-sm text-fg-subtle max-w-xs mx-auto">
        {{ t("views.friendLinks.detail.emptyDesc") }}
      </p>
    </div>
  </div>
</template>
