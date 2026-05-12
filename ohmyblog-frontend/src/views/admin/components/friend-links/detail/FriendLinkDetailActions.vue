<!--
  src/views/admin/components/friend-links/detail/FriendLinkDetailActions.vue
  友链详情底部操作区
  - 审批通过（仅 pending）
  - 拒绝（仅 pending，打开 FriendLinkRejectModal）
  - 删除（任意状态）
  - 操作成功后 emit('updated') 通知父组件刷新列表
-->
<script setup lang="ts">
import { ref } from "vue";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { useFriendLinkStore } from "@/stores/friend-link.store";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import FriendLinkRejectModal from "./FriendLinkRejectModal.vue";
import { approveFriendLink, rejectFriendLink, deleteFriendLink } from "@/api/friend-link.api";
import type { FriendLinkItem } from "../types";

const props = defineProps<{
  item: FriendLinkItem;
}>();

const emit = defineEmits<{
  /** 任意操作成功后触发，通知父组件刷新列表 */
  updated: [];
}>();

const { t } = useLang();
const friendLinkStore = useFriendLinkStore();

// ── 拒绝弹窗状态 ──────────────────────────────────────────────────────────────
const rejectModalOpen = ref(false);
const rejectLoading = ref(false);

// ── 操作 loading 状态 ────────────────────────────────────────────────────────
const approveLoading = ref(false);
const deleteLoading = ref(false);

/** 审批通过 */
const handleApprove = async () => {
  approveLoading.value = true;
  try {
    const res = await approveFriendLink(props.item.uuid);
    useToast.success(t(`api.success.${(res as any)?.message ?? "已通过"}`));
    friendLinkStore.fetchPendingCount();
    emit("updated");
  } catch (e: any) {
    useToast.error(t(`api.errors.${e?.message ?? e ?? "Error"}`));
  } finally {
    approveLoading.value = false;
  }
};

/** 拒绝确认（从弹窗接收 reason） */
const handleRejectConfirm = async (reason: string | undefined) => {
  rejectLoading.value = true;
  try {
    const res = await rejectFriendLink(props.item.uuid, { rejectReason: reason });
    useToast.success(t(`api.success.${(res as any)?.message ?? "已拒绝"}`));
    rejectModalOpen.value = false;
    friendLinkStore.fetchPendingCount();
    emit("updated");
  } catch (e: any) {
    useToast.error(t(`api.errors.${e?.message ?? e ?? "Error"}`));
  } finally {
    rejectLoading.value = false;
  }
};

/** 删除 */
const handleDelete = async () => {
  deleteLoading.value = true;
  try {
    const res = await deleteFriendLink(props.item.uuid);
    useToast.success(t(`api.success.${(res as any)?.message ?? "删除成功"}`));
    friendLinkStore.fetchPendingCount();
    emit("updated");
  } catch (e: any) {
    useToast.error(t(`api.errors.${e?.message ?? e ?? "Error"}`));
  } finally {
    deleteLoading.value = false;
  }
};
</script>

<template>
  <div class="p-4 border-t border-border/50 flex items-center gap-2 flex-wrap">
    <!-- 审批通过：仅 pending -->
    <ButtonPrimary
      v-if="item.status === 'pending'"
      :text="t('views.friendLinks.actions.approve')"
      :loading="approveLoading"
      @click="handleApprove"
    />

    <!-- 拒绝：仅 pending -->
    <ButtonSecondary
      v-if="item.status === 'pending'"
      :text="t('views.friendLinks.actions.reject')"
      :disabled="approveLoading"
      class="px-4 py-2 text-sm"
      @click="rejectModalOpen = true"
    />

    <!-- 删除：任意状态 -->
    <ButtonSecondary
      :text="t('views.friendLinks.actions.delete')"
      :disabled="approveLoading || deleteLoading"
      class="px-4 py-2 text-sm text-red-500 hover:text-red-500 ml-auto"
      @click="handleDelete"
    />
  </div>

  <!-- 拒绝弹窗（Teleport 到 body） -->
  <FriendLinkRejectModal
    v-model="rejectModalOpen"
    :item="item"
    :loading="rejectLoading"
    @confirm="handleRejectConfirm"
  />
</template>
