<!--
  src/views/admin/components/friend-links/list/FriendLinkListActions.vue
  友链列表操作区域组件
  - 提供状态过滤切换（全部 / 待审批 / 已通过 / 已拒绝）
-->
<script setup lang="ts">
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useLang } from "@/composables/lang.hook";
import type { FriendLinkFilters } from "../types";

const props = defineProps<{
  status?: FriendLinkFilters["status"];
}>();

const emit = defineEmits<{
  "update:status": [value: FriendLinkFilters["status"]];
}>();

const { t } = useLang();

const statusOptions: { key: FriendLinkFilters["status"]; labelKey: string }[] = [
  { key: undefined,   labelKey: "views.friendLinks.filters.all" },
  { key: "pending",   labelKey: "views.friendLinks.filters.pending" },
  { key: "approved",  labelKey: "views.friendLinks.filters.approved" },
  { key: "rejected",  labelKey: "views.friendLinks.filters.rejected" },
];
</script>

<template>
  <div class="p-4 border-b border-border/40 flex items-center gap-2">
    <!-- 状态筛选 pill 组 -->
    <div class="flex items-center gap-1 p-1 bg-bg-muted-soft rounded-2xl w-full">
      <ButtonSecondary
        v-for="opt in statusOptions"
        :key="String(opt.key)"
        class="flex-1 text-sm"
        :isActive="status === opt.key"
        :text="t(opt.labelKey)"
        @click="emit('update:status', opt.key)"
      />
    </div>
  </div>
</template>
