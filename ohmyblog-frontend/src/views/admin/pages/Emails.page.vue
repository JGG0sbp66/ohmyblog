<!-- 
  src/views/admin/pages/Emails.page.vue 
  邮件管理页面（消息中心风格重构版）
  - 采用左右分栏布局：左侧消息列表，右侧详情预览
  - 支持无限滚动加载，支持按状态（成功、失败）过滤
-->
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import BaseCard from "@/components/base/card/BaseCard.vue";
import { useEmailStore } from "@/stores/email.store";
import EmailList from "@/views/admin/components/emails/EmailList.vue";
import EmailDetailView from "@/views/admin/components/emails/EmailDetailView.vue";
import EmailListActions from "@/views/admin/components/emails/EmailListActions.vue";
import type {
  EmailLogFilters as TFilters,
  EmailLogItem,
} from "@/views/admin/components/emails/types";

const emailStore = useEmailStore();

// 过滤与状态追踪
const filters = ref<TFilters>({ type: undefined, isRead: undefined });

// 当前选中的邮件项（用于右侧详情展示）
const selectedItem = ref<EmailLogItem | null>(null);

/** 消费从通知面板带过来的待打开项 */
const consumePending = () => {
  if (emailStore.pendingOpenItem) {
    selectedItem.value = emailStore.pendingOpenItem;
    emailStore.pendingOpenItem = null;
  }
};

onMounted(consumePending);

/**
 * 已在邮件页时再次点击通知面板卡片，路由不会触发组件重载。
 * 通过监听 store 中的 pendingOpenItem 来响应重复点击或页面内跳转。
 */
watch(() => emailStore.pendingOpenItem, consumePending);
</script>

<template>
  <!-- 主容器 -->
  <BaseCard
    padding="none"
    class="flex-1 overflow-hidden flex onload-animation"
  >
    <!-- 左侧列表 -->
    <div
      class="w-100 border-r border-border/40 flex flex-col bg-bg-muted/10 onload-animation anim-delay-100"
    >
      <!-- 操作区域 -->
      <EmailListActions
        v-model:isRead="filters.isRead"
        v-model:type="filters.type"
      />

      <!-- 消息列表组件 -->
      <EmailList v-model="selectedItem" :filters="filters" />
    </div>

    <!-- 右侧展示区域 -->
    <div class="flex-1 overflow-hidden onload-animation anim-delay-150">
      <EmailDetailView :item="selectedItem" />
    </div>
  </BaseCard>
</template>
