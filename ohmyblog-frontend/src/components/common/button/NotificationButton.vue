<!-- src/components/common/button/NotificationButton.vue -->
<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BellIcon from "@/components/icon/ui/Bell.vue";
import DropButton from "@/components/common/button/DropButton.vue";
import UnreadBadge from "@/components/base/tag/UnreadBadge.vue";
import EmailListCard from "@/views/admin/components/emails/EmailListCard.vue";
import { useEmailStore } from "@/stores/email.store";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { useEmailLogList } from "@/composables/email-log-list.hook";
import type { EmailLogItem } from "@/views/admin/components/emails/types";

const { t } = useLang();
const router = useRouter();
const emailStore = useEmailStore();

const scrollContainer = ref<HTMLElement | null>(null);
const isMarkingRead = ref(false);

// 列表数据加载与状态管理
const {
  list: unreadList,
  isLoading,
  isFinished,
  fetchList: fetchUnreadList,
} = useEmailLogList(() => ({ isRead: false }), scrollContainer);

// 缓存与预加载逻辑
let lastFetchTime = 0;
const STALE_MS = 30_000; // 30秒缓存

/** 鼠标移入通知图标时：如果数据为空或已过期，刷新列表 */
const onPopupEnter = () => {
  if (Date.now() - lastFetchTime > STALE_MS || unreadList.value.length === 0) {
    lastFetchTime = Date.now();
    fetchUnreadList(true);
  }
};

/** 组件挂载时：如果有未读消息，静默预加载第一页数据，提升弹窗打开速度 */
onMounted(() => {
  if (emailStore.unreadCount > 0) {
    lastFetchTime = Date.now();
    fetchUnreadList(true);
  }
});

/** 一键已读 */
const handleMarkAllRead = async () => {
  if (isMarkingRead.value) return;
  isMarkingRead.value = true;
  try {
    await emailStore.markAllAsRead();
    unreadList.value = [];
    isFinished.value = true;
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isMarkingRead.value = false;
  }
};

/** 点击邮件卡片：存入 store 供跳转后的页面消费，并执行跳转 */
const handleCardClick = (item: EmailLogItem) => {
  emailStore.pendingOpenItem = item;
  router.push({ name: "emails" }).catch(() => {});
};

/** 查看全部 */
const handleViewAll = () => {
  router.push({ name: "emails" }).catch(() => {});
};
</script>

<template>
  <DropButton
    trigger-class="w-11 h-11 relative"
    content-class="w-80 flex flex-col overflow-hidden"
    placement="-left-60"
    @mouseenter="onPopupEnter"
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
      <div
        ref="scrollContainer"
        class="overflow-y-auto max-h-80 border-t border-fg-muted/10 notification-list"
      >
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
