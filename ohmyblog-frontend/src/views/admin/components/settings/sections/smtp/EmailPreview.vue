<!-- src/views/admin/components/settings/sections/smtp/EmailPreview.vue -->
<script setup lang="ts">
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import BrowserMockup from "@/components/common/container/BrowserMockup.vue";
import Inbox from "@/components/icon/common/Inbox.vue";
import TemplatePreview from "./TemplatePreview.vue";
import { computed } from "vue";

const { t, locale } = useLang();
const systemStore = useSystemStore();

const currentTime = computed(() =>
  new Date().toLocaleString(locale.value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }),
);

interface Props {
  senderName?: string;
  senderEmail?: string;
  recipients?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  senderName: "ohmyblog",
  senderEmail: "noreply@ohmyblog.com",
  recipients: () => [],
});

const toDisplay = computed(() =>
  props.recipients.length > 0 ? props.recipients.join(", ") : "you@example.com",
);

// 模拟标签页标题和图标，保持与其他预览页面一致
</script>

<template>
  <BrowserMockup
    :title="systemStore.siteInfo.title"
    :icon="systemStore.siteInfo.favicon"
  >
    <!-- 邮件模拟界面-->
    <div
      class="h-full w-full bg-bg-card p-6 lg:p-8 flex flex-col overflow-y-auto"
    >
      <!-- 邮件标题 -->
      <div class="max-w-4xl w-full mx-auto mb-6">
        <h1 class="text-2xl font-bold tracking-tight text-fg">
          {{ t("views.admin.Settings.smtp.preview.testEmailTitle") }}
        </h1>
      </div>

      <!-- 邮件头 -->
      <div
        class="max-w-4xl w-full mx-auto pb-6 border-b border-border/50 flex items-start gap-4"
      >
        <!-- 图标 -->
        <div
          class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mt-0.5 shrink-0"
        >
          <Inbox size-class="w-5 h-5" />
        </div>
        <!-- 文字区 -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-bold flex items-center gap-2 truncate">
            {{ props.senderName }}
            <span class="text-xs font-normal opacity-50"
              >&lt;{{ props.senderEmail }}&gt;</span
            >
          </div>
          <div class="flex items-center justify-between mt-1">
            <div class="text-xs opacity-40">To: {{ toDisplay }}</div>
            <div class="text-xs opacity-30">{{ currentTime }}</div>
          </div>
        </div>
      </div>

      <!-- 邮件正文组件 -->
      <div class="max-w-4xl w-full mx-auto py-8 flex justify-center">
        <TemplatePreview
          :site-title="systemStore.siteInfo.title"
          :current-time="currentTime"
          :admin-name="systemStore.personalInfo.username"
          :site-footer="systemStore.siteInfo.footer"
          :sender-email="props.senderEmail"
        />
      </div>
    </div>
  </BrowserMockup>
</template>
