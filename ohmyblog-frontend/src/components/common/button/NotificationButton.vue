<!-- src/components/common/button/NotificationButton.vue -->
<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BellIcon from "@/components/icon/ui/Bell.vue";
import DropButton from "@/components/common/button/DropButton.vue";
import UnreadBadge from "@/components/base/tag/UnreadBadge.vue";
import EmailListCard from "@/views/admin/components/emails/EmailListCard.vue";
import { getEmailLogs } from "@/api/email.api";
import { useEmailStore } from "@/stores/email.store";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import type { EmailLogItem } from "@/views/admin/components/emails/types";

const { t } = useLang();
const router = useRouter();
const emailStore = useEmailStore();

const unreadList = ref<EmailLogItem[]>([]);
const isLoading = ref(false);
const isMarkingRead = ref(false);

const fetchUnreadList = async () => {
  isLoading.value = true;
  try {
    const res = await getEmailLogs({ page: 1, pageSize: 5, isRead: false });
    unreadList.value = (res?.list ?? []) as EmailLogItem[];
  } finally {
    isLoading.value = false;
  }
};

const handleMarkAllRead = async () => {
  if (isMarkingRead.value) return;
  isMarkingRead.value = true;
  try {
    await emailStore.markAllAsRead();
    unreadList.value = [];
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isMarkingRead.value = false;
  }
};

const handleCardClick = (item: EmailLogItem) => {
  emailStore.pendingOpenItem = item;
  router.push({ name: "emails" });
};

const handleViewAll = () => {
  router.push({ name: "emails" });
};
</script>

<template>
  <DropButton
    trigger-class="w-11 h-11 relative"
    content-class="w-80 flex flex-col overflow-hidden"
    placement="-left-60"
    @mouseenter="fetchUnreadList"
  >
    <template #trigger="{ active }">
      <ButtonSecondary :isActive="active" class="w-full h-full">
        <BellIcon />
      </ButtonSecondary>
      <UnreadBadge :count="emailStore.unreadCount" :isExpanded="false" />
    </template>

    <template #content>
      <!-- Section 1: Header + Mark All Read -->
      <div class="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
        <div class="flex items-center gap-1.5">
          <span class="text-fg font-bold text-base">
            {{ t("views.emails.filters.unread") }}
          </span>
          <UnreadBadge :count="emailStore.unreadCount" :isExpanded="true" />
        </div>
        <ButtonPrimary
          class="text-xs"
          :text="t('components.common.button.NotificationButton.markAllRead')"
          :loading="isMarkingRead"
          :disabled="emailStore.unreadCount === 0"
          @click="handleMarkAllRead"
        />
      </div>

      <!-- Section 2: Unread email list -->
      <div class="overflow-y-auto max-h-80 border-t border-fg-muted/10 notification-list">
        <!-- Loading skeleton -->
        <div v-if="isLoading" class="flex flex-col">
          <div
            v-for="i in 3"
            :key="i"
            class="h-24 bg-bg-muted-soft animate-pulse shrink-0 border-b border-fg-muted/10"
          ></div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="unreadList.length === 0"
          class="flex items-center justify-center py-8 text-fg-subtle text-sm"
        >
          {{ t("components.common.button.NotificationButton.empty") }}
        </div>

        <!-- Email cards -->
        <EmailListCard
          v-else
          v-for="item in unreadList"
          :key="item.uuid"
          :item="item"
          @click="handleCardClick(item)"
        />
      </div>

      <!-- Section 3: View All -->
      <div class="px-4 py-3 shrink-0 border-t border-fg-muted/10">
        <ButtonSecondary
          class="w-full justify-center text-sm py-2"
          :text="t('components.common.button.NotificationButton.viewAll')"
          @click="handleViewAll"
        />
      </div>
    </template>
  </DropButton>
</template>

<style scoped>
.notification-list {
  scrollbar-width: none; /* Firefox */
}
.notification-list::-webkit-scrollbar {
  width: 0; /* Chrome / Safari / Edge */
}
</style>
