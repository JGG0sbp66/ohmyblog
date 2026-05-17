<!--
  src/views/admin/components/friend-links/detail/FriendLinkDeleteModal.vue
  删除友链确认弹窗
  - 展示要删除的友链信息（头像、名称、URL）
  - 显示警告提示
  - 确认后向父组件 emit，由父组件负责调用 API
-->
<script setup lang="ts">
import { computed } from "vue";
import { Trash2 } from "lucide-vue-next";
import ConfirmModal from "@/components/base/pop/ConfirmModal.vue";
import { useLang } from "@/composables/lang.hook";
import { getFriendLinkInitial } from "@/utils/friend-link";
import type { FriendLinkItem } from "../types";

const props = defineProps<{
  modelValue: boolean;
  item: FriendLinkItem | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  /** 用户点击确认删除 */
  confirm: [];
}>();

const { t } = useLang();

const initial = computed(() =>
  props.item ? getFriendLinkInitial(props.item.name) : "",
);
</script>

<template>
  <ConfirmModal
    :model-value="modelValue"
    :icon="Trash2"
    :title="t('views.friendLinks.delete.title')"
    :question="t('views.friendLinks.delete.message')"
    :warning="t('views.friendLinks.delete.warning')"
    :confirm-text="t('common.delete')"
    confirm-class="bg-red-500 hover:bg-red-600"
    :loading="loading"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="emit('confirm')"
  >
    <!-- 显示要删除的友链信息（带头像） -->
    <div v-if="item" class="p-3 bg-bg-muted rounded-lg border border-border/30">
      <div class="flex items-center gap-3">
        <!-- 圆形头像或首字占位 -->
        <div
          class="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center"
        >
          <img
            v-if="item.avatarUrl"
            :src="item.avatarUrl"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-sm font-bold text-accent">{{
            initial
          }}</span>
        </div>

        <!-- 名称和 URL -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-fg truncate">{{ item.name }}</p>
          <p class="text-xs text-fg-subtle mt-0.5 truncate">{{ item.url }}</p>
        </div>
      </div>
    </div>
  </ConfirmModal>
</template>
