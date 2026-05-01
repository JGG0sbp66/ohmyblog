<!-- 
  src/views/admin/components/emails/EmailDetailView.vue 
  邮件详情展示区域
  - 顶部显示邮件元数据（主题、状态、发件人、收件人、时间）
  - 中间使用 iframe 沙箱渲染邮件 HTML 正文
  - 底部显示发送失败的错误详情（如果有）
-->
<script setup lang="ts">
import { computed } from "vue";
import type { EmailLogItem } from "./types";
import { getEmailLogPreviewUrl } from "@/api/email.api";
import { useLang } from "@/composables/lang.hook";
import Inbox from "@/components/icon/common/Inbox.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";

const props = defineProps<{
  item: EmailLogItem | null;
}>();

const { t } = useLang();

/** 计算当前选中邮件的 HTML 预览 URL */
const previewUrl = computed(() =>
  props.item ? getEmailLogPreviewUrl(props.item.uuid) : "",
);

/**
 * 格式化详细发送时间
 * @param raw 原始时间数据
 */
const formatTime = (raw: string | number | Date) => {
  const d = new Date(raw);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};
</script>

<template>
  <div class="h-full flex flex-col bg-bg-card">
    <template v-if="item">
      <!-- Header -->
      <div class="p-6 lg:p-8 border-b border-border/50">
        <div class="flex justify-between items-start mb-6">
          <h1 class="text-2xl font-bold tracking-tight text-fg leading-tight">
            {{ item.subject }}
          </h1>
          <BaseTag
            :type="item.status === 'success' ? 'success' : 'error'"
            size="sm"
            class="shrink-0 uppercase font-bold tracking-wider"
          >
            {{ t(`views.emails.statuses.${item.status}`) }}
          </BaseTag>
        </div>

        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
            <Inbox size-class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold text-fg truncate">
              {{ item.fromName }}
              <span class="text-xs font-normal text-fg-subtle ml-2">&lt;{{ item.fromEmail }}&gt;</span>
            </div>
            <div class="flex items-center justify-between mt-1">
              <div class="text-xs text-fg-subtle truncate mr-4">To: {{ item.to }}</div>
              <div class="text-xs text-fg-subtle whitespace-nowrap">{{ formatTime(item.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content (Iframe) -->
      <div class="flex-1 bg-white overflow-hidden relative">
        <iframe
          :src="previewUrl"
          class="w-full h-full border-none"
          sandbox=""
          :title="item.subject"
        ></iframe>
      </div>

      <!-- Footer / Error Message if failed -->
      <div v-if="item.status === 'failed' && item.errorMessage" class="p-4 bg-red-500/5 border-t border-red-500/20">
        <div class="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1">
          {{ t("views.emails.preview.errorMessageLabel") }}
        </div>
        <div class="font-mono text-xs text-red-500 break-all leading-relaxed">
          {{ item.errorMessage }}
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="h-full flex flex-col items-center justify-center p-12 text-center">
      <div class="w-16 h-16 rounded-3xl bg-bg-muted flex items-center justify-center text-fg-subtle mb-4">
        <Inbox size-class="w-8 h-8 opacity-20" />
      </div>
      <h3 class="text-lg font-bold text-fg mb-2">{{ t('views.emails.empty_selection_title') }}</h3>
      <p class="text-sm text-fg-subtle max-w-xs mx-auto">
        {{ t('views.emails.empty_selection_desc') }}
      </p>
    </div>
  </div>
</template>
