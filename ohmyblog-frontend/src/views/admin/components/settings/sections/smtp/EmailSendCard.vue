<!-- 
  src/views/admin/components/settings/sections/smtp/EmailSendCard.vue
  邮件发送卡片：收件人输入框实时解析并双向同步至可编辑分页列表，点击发送后通过后端 SMTP 投递。
-->
<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ListEditorLayout from "@/components/common/list/ListEditorLayout.vue";
import RecipientPreviewList from "./RecipientPreviewList.vue";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";
import { useListEditor } from "@/composables/list-editor.hook";
import { generateId } from "@/utils/id";
import { sendEmail } from "@/api/email.api";

const { t } = useLang();
const toast = useToast;
const PAGE_SIZE = 5;

const recipientInput = ref("");
const isSending = ref(false);

/** 防止 TipInput ↔ 列表的循环更新 */
const isSyncing = ref(false);

const {
  items: recipients,
  currentPage,
  totalPages,
  pagedRows,
  addItem,
  removeItem,
  updateItem,
} = useListEditor({
  initialSource: [] as string[],
  pageSize: PAGE_SIZE,
  mapToLocal: (email: string) => ({ value: email }),
  mapToRemote: (body) => body.value,
  /** 列表 → TipInput：任何列表变更（编辑/删除/新增）都触发此回调同步回输入框 */
  onSync: (emails) => {
    if (isSyncing.value) return;
    isSyncing.value = true;
    recipientInput.value = emails.filter(Boolean).join(", ");
    nextTick(() => {
      isSyncing.value = false;
    });
  },
  newItemFactory: () => ({ value: "" }),
});

/** TipInput → 列表：实时解析并整体替换列表内容 */
watch(recipientInput, (newVal) => {
  if (isSyncing.value) return;
  isSyncing.value = true;
  const emails = newVal
    .split(/[,;，；\s]+/)
    .map((e) => e.trim())
    .filter(Boolean);
  recipients.value = emails.map((email) => ({ value: email, id: generateId() }));
  nextTick(() => {
    isSyncing.value = false;
  });
});

defineExpose({ recipients });

const handleSend = async () => {
  const to = recipients.value.map((r) => r.value).filter(Boolean);
  if (!to.length) {
    toast.error(t("views.admin.Settings.smtp.send.noRecipient"));
    return;
  }
  try {
    isSending.value = true;
    const result = await sendEmail({ to, content: [] });
    if (result?.message) {
      toast.success(t(`api.success.${result.message}`));
    }
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isSending.value = false;
  }
};
</script>

<template>
  <SettingCard
    :title="t('views.admin.Settings.smtp.send.title')"
    :description="t('views.admin.Settings.smtp.send.description')"
  >
    <div class="flex flex-col gap-6">
      <!-- 收件人批量输入框：修改会实时同步至下方列表 -->
      <TipInput
        v-model="recipientInput"
        :label="t('views.admin.Settings.smtp.send.recipient.label')"
        :hint="t('views.admin.Settings.smtp.send.recipient.hint')"
        :placeholder="t('views.admin.Settings.smtp.send.recipient.placeholder')"
      />

      <!-- 收件人列表：可分页、可逐条编辑/删除/新增 -->
      <ListEditorLayout
        :title="t('views.admin.Settings.smtp.send.list.title')"
        :count="recipients.length"
        :add-text="t('views.admin.Settings.smtp.send.list.add')"
        :show-pagination="recipients.length > PAGE_SIZE"
        :current-page="currentPage"
        :total-pages="totalPages"
        @add="addItem"
        @update:current-page="currentPage = $event"
      >
        <RecipientPreviewList
          :items="pagedRows"
          @update="(id, val) => updateItem(id, { value: val })"
          @remove="removeItem"
        />
      </ListEditorLayout>

      <!-- 发送按钮 -->
      <div class="flex justify-end pt-4">
        <ButtonPrimary
          :text="t('views.admin.Settings.smtp.send.button')"
          :loading="isSending"
          class="w-full sm:w-auto px-8"
          @click="handleSend"
        />
      </div>
    </div>
  </SettingCard>
</template>
