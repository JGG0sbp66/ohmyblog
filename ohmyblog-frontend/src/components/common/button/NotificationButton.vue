<!-- src/components/common/button/NotificationButton.vue -->
<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { RiNotification3Line } from "@remixicon/vue";
import DropButton from "@/components/common/button/DropButton.vue";
import UnreadBadge from "@/components/base/tag/UnreadBadge.vue";
import BaseSheet from "@/components/base/pop/BaseSheet.vue";
import NotificationPanel from "@/components/common/notification/NotificationPanel.vue";
import { useEmailStore } from "@/stores/email.store";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { useEmailLogList } from "@/composables/email-log-list.hook";
import { useIsMobile } from "@/composables/breakpoint.hook";
import type { EmailLogItem } from "@/views/admin/components/emails/types";

const { t } = useLang();
const router = useRouter();
const emailStore = useEmailStore();
const isMobile = useIsMobile();

const scrollContainer = ref<HTMLElement | null>(null);
const isMarkingRead = ref(false);
const mobileOpen = ref(false);
const dropRef = ref<InstanceType<typeof DropButton> | null>(null);

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
  mobileOpen.value = false;
  dropRef.value?.close();
  emailStore.pendingOpenItem = item;
  router.push({ name: "emails" }).catch(() => {});
};

/** 查看全部 */
const handleViewAll = () => {
  mobileOpen.value = false;
  dropRef.value?.close();
  router.push({ name: "emails" }).catch(() => {});
};

const openMobile = () => {
  onPopupEnter();
  mobileOpen.value = true;
};

const handleScrollContainer = (element: HTMLElement | null) => {
  scrollContainer.value = element;
};
</script>

<template>
  <div class="relative h-11 w-11">
    <DropButton
      v-if="!isMobile"
      ref="dropRef"
      trigger-class="w-11 h-11 relative"
      content-class="w-80 flex flex-col overflow-hidden"
      placement="-left-60"
      @mouseenter="onPopupEnter"
    >
      <template #trigger="{ active }">
        <ButtonSecondary
          :is-active="active"
          class="h-full! w-full!"
          :aria-label="t('components.common.button.NotificationButton.title')"
        >
          <RiNotification3Line class="h-5 w-5" />
        </ButtonSecondary>
        <UnreadBadge :count="emailStore.unreadCount" :is-expanded="false" />
      </template>

      <template #content>
        <NotificationPanel
          :items="unreadList"
          :unread-count="emailStore.unreadCount"
          :show-skeleton="showSkeleton"
          :show-empty="showEmpty"
          :is-marking-read="isMarkingRead"
          @mark-all-read="handleMarkAllRead"
          @card-click="handleCardClick"
          @view-all="handleViewAll"
          @scroll-container="handleScrollContainer"
        />
      </template>
    </DropButton>

    <template v-else>
      <ButtonSecondary
        class="h-full! w-full!"
        :is-active="mobileOpen"
        :aria-label="t('components.common.button.NotificationButton.title')"
        @click="openMobile"
      >
        <RiNotification3Line class="h-5 w-5" />
      </ButtonSecondary>
      <UnreadBadge :count="emailStore.unreadCount" :is-expanded="false" />

      <BaseSheet v-model="mobileOpen">
        <NotificationPanel
          mobile
          :items="unreadList"
          :unread-count="emailStore.unreadCount"
          :show-skeleton="showSkeleton"
          :show-empty="showEmpty"
          :is-marking-read="isMarkingRead"
          @mark-all-read="handleMarkAllRead"
          @card-click="handleCardClick"
          @view-all="handleViewAll"
          @close="mobileOpen = false"
          @scroll-container="handleScrollContainer"
        />
      </BaseSheet>
    </template>
  </div>
</template>
