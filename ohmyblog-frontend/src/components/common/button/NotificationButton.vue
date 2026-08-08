<!-- src/components/common/button/NotificationButton.vue -->
<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import { RiNotification3Line } from "@remixicon/vue";
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
  hasLoaded,
  fetchList: fetchUnreadList,
} = useEmailLogList(() => ({ isRead: false }), scrollContainer);

// 缓存与预加载逻辑
let lastFetchTime = 0;
const STALE_MS = 30_000; // 30秒缓存

/**
 * 鼠标移入通知图标时刷新列表。
 *
 * 原来这里有一条 `|| list.length === 0`：真的没有未读时列表恒为空，于是每次移入
 * 都重新请求，30s 缓存等于没有，面板每次都要闪一个 RTT 的骨架屏（高延迟机器上
 * 极其明显）。改成只在「没拉过 / 已过期 / badge 说有未读但列表却是空」时才请求，
 * 最后一条保留了原意——预加载失败后仍能靠下一次移入重试。
 */
const onPopupEnter = () => {
  const stale = Date.now() - lastFetchTime > STALE_MS;
  const missing = emailStore.unreadCount > 0 && unreadList.value.length === 0;
  if (!hasLoaded.value || stale || missing) {
    lastFetchTime = Date.now();
    fetchUnreadList(true);
  }
};

/**
 * 骨架屏只在「确实要等一个未知结果」时出现：
 * - 已有条目 → 保持旧列表，后台静默刷新（stale-while-revalidate），不闪回骨架
 * - badge 未读数为 0 → 结果已经知道了，直接给空态，不为一次注定为空的请求铺骨架
 */
const showSkeleton = computed(
  () =>
    (isLoading.value || !hasLoaded.value) &&
    unreadList.value.length === 0 &&
    emailStore.unreadCount > 0,
);

/** 空态：没有条目、且不处于等待中（含 badge 为 0 的乐观空态） */
const showEmpty = computed(
  () => unreadList.value.length === 0 && !showSkeleton.value,
);

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
        <RiNotification3Line class="w-5 h-5" />
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
        <div v-if="showSkeleton" class="flex flex-col">
          <div
            v-for="i in 3"
            :key="i"
            class="h-24 bg-bg-muted-soft animate-pulse shrink-0 border-b border-fg-muted/10"
          ></div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="showEmpty"
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
