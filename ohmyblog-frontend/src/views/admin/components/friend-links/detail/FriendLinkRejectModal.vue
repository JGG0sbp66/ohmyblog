<!--
  src/views/admin/components/friend-links/detail/FriendLinkRejectModal.vue
  拒绝友链申请弹窗
  - 展示被拒绝站点的名称
  - 提供可选的拒绝原因输入（TipTextarea）
  - 确认后向父组件 emit 拒绝原因，由父组件负责调用 API
-->
<script setup lang="ts">
import { ref, watch } from "vue";
import { XCircle } from "lucide-vue-next";
import BaseModal from "@/components/base/pop/BaseModal.vue";
import TipTextarea from "@/components/common/input/TipTextarea.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useLang } from "@/composables/lang.hook";
import type { FriendLinkItem } from "../types";

const props = defineProps<{
  modelValue: boolean;
  item: FriendLinkItem | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  /** 用户点击确认，携带可选拒绝原因 */
  confirm: [reason: string | undefined];
}>();

const { t } = useLang();

const reason = ref("");

/** 弹窗关闭时重置输入 */
watch(() => props.modelValue, (val) => {
  if (!val) reason.value = "";
});

const handleConfirm = () => {
  emit("confirm", reason.value.trim() || undefined);
};
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    max-width="max-w-lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <XCircle class="w-5 h-5 text-red-500" />
        <h2 class="text-xl font-bold text-fg">
          {{ t("views.friendLinks.reject.title") }}
        </h2>
      </div>
      <p v-if="item" class="text-sm text-fg-subtle mt-0.5 ml-7">
        {{ item.name }}
      </p>
    </template>

    <!-- 拒绝原因（可选） -->
    <TipTextarea
      v-model="reason"
      :label="t('views.friendLinks.reject.reasonLabel')"
      :placeholder="t('views.friendLinks.reject.reasonPlaceholder')"
    />

    <template #footer>
      <ButtonSecondary
        :text="t('common.cancel')"
        class="min-w-24 py-2"
        @click="emit('update:modelValue', false)"
      />
      <ButtonPrimary
        :text="t('common.confirm')"
        :loading="loading"
        class="min-w-24 py-2"
        @click="handleConfirm"
      />
    </template>
  </BaseModal>
</template>
