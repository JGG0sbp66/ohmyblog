<!--
  src/views/admin/pages/FriendLinks.page.vue
  友链审批页面
  - 左右分栏：左侧列表面板（筛选 + 列表），右侧详情面板（信息 + 操作）
  - 操作完成后通过 listRef.refresh() 刷新列表并清空选中项
-->
<script setup lang="ts">
import { ref } from "vue";
import AdminSplitLayout from "@/views/admin/components/layout/AdminSplitLayout.vue";
import FriendLinkListActions from "@/views/admin/components/friend-links/list/FriendLinkListActions.vue";
import FriendLinkList from "@/views/admin/components/friend-links/list/FriendLinkList.vue";
import FriendLinkDetailPanel from "@/views/admin/components/friend-links/detail/FriendLinkDetailPanel.vue";
import type {
  FriendLinkItem,
  FriendLinkFilters,
} from "@/views/admin/components/friend-links/types";

/** 当前筛选条件 */
const filters = ref<FriendLinkFilters>({ status: undefined });

/** 当前选中的友链（在两个子组件间共享） */
const selectedItem = ref<FriendLinkItem | null>(null);

/** 列表 ref，用于操作后触发强制刷新 */
const listRef = ref<InstanceType<typeof FriendLinkList> | null>(null);

/** 操作完成后：清空选中项并刷新列表 */
const handleUpdated = () => {
  selectedItem.value = null;
  listRef.value?.refresh();
};
</script>

<template>
  <AdminSplitLayout>
    <template #left>
      <!-- 筛选操作区 -->
      <FriendLinkListActions v-model:status="filters.status" />
      <!-- 列表 -->
      <FriendLinkList ref="listRef" v-model="selectedItem" :filters="filters" />
    </template>

    <template #right>
      <FriendLinkDetailPanel :item="selectedItem" @updated="handleUpdated" />
    </template>
  </AdminSplitLayout>
</template>
