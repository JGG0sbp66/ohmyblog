<script setup lang="ts">
import { RotateCcw } from "lucide-vue-next";
import ConfirmModal from "@/components/base/pop/ConfirmModal.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import { useLang } from "@/composables/lang.hook";
import type { FriendLinkItem } from "../types";

defineProps<{
  modelValue: boolean;
  item: FriendLinkItem | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();

const { t } = useLang();
</script>

<template>
  <ConfirmModal
    :model-value="modelValue"
    :icon="RotateCcw"
    icon-class="text-amber-500"
    :title="t('views.friendLinks.reopen.title')"
    :question="t('views.friendLinks.reopen.message')"
    :warning="t('views.friendLinks.reopen.warning')"
    :confirm-text="t('views.friendLinks.actions.reopen')"
    :loading="loading"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="emit('confirm')"
  >
    <div
      v-if="item"
      class="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-bg-muted p-3"
    >
      <div class="min-w-0">
        <p class="truncate text-sm font-medium text-fg">{{ item.name }}</p>
        <p class="mt-0.5 truncate text-xs text-fg-subtle">{{ item.url }}</p>
      </div>
      <BaseTag
        :type="item.status === 'approved' ? 'success' : 'error'"
        :show-icon="false"
        class="shrink-0"
      >
        {{ t(`views.friendLinks.status.${item.status}`) }}
      </BaseTag>
    </div>
  </ConfirmModal>
</template>
