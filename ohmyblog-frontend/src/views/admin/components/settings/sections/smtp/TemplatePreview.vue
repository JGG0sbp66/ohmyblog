<!-- src/views/admin/components/settings/sections/smtp/TemplatePreview.vue -->
<script setup lang="ts">
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

interface Props {
  siteTitle?: string;
  currentTime?: string;
  adminName?: string;
  siteFooter?: string;
  senderEmail?: string;
}

const props = withDefaults(defineProps<Props>(), {
  siteTitle: "ohmyblog",
  currentTime: "",
  adminName: "Admin",
  siteFooter: "",
  senderEmail: "noreply@ohmyblog.com",
});
</script>

<template>
  <div class="email-template-container mx-auto">
    <div class="py-8 px-4 lg:px-8">
      <!-- 问候语 -->
      <h2 class="text-xl font-bold text-fg mb-6">
        {{ t("views.admin.Settings.smtp.preview.greeting", { name: props.adminName }) }}
      </h2>

      <!-- 正文 -->
      <div class="space-y-6 text-fg/80 leading-relaxed">
        <p>
          {{ t("views.admin.Settings.smtp.preview.testMessage") }}
        </p>

        <!-- 连接详情 -->
        <div class="bg-bg-muted/50 rounded-xl p-6 border border-border/50 space-y-4">
          <div class="flex items-center gap-2 text-fg font-bold text-sm uppercase tracking-wider opacity-70">
            <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
            {{ t("views.admin.Settings.smtp.preview.connectionDetailsTitle") }}
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-[10px] uppercase font-bold opacity-40 tracking-tight">{{ t("views.admin.Settings.smtp.preview.detailProtocol") }}</p>
              <p class="text-sm font-mono text-accent">SMTP / ESMTP</p>
            </div>
            <div class="space-y-1">
              <p class="text-[10px] uppercase font-bold opacity-40 tracking-tight">{{ t("views.admin.Settings.smtp.preview.detailEncryption") }}</p>
              <p class="text-sm font-mono text-accent">STARTTLS / SSL</p>
            </div>
            <div class="space-y-1">
              <p class="text-[10px] uppercase font-bold opacity-40 tracking-tight">{{ t("views.admin.Settings.smtp.preview.detailSender") }}</p>
              <p class="text-sm font-mono text-fg/70">{{ props.senderEmail }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-[10px] uppercase font-bold opacity-40 tracking-tight">{{ t("views.admin.Settings.smtp.preview.detailTime") }}</p>
              <p class="text-sm font-mono text-fg/70">{{ props.currentTime }}</p>
            </div>
          </div>
        </div>

        <p class="text-sm opacity-60 italic">
          {{ t("views.admin.Settings.smtp.preview.footerNote") }}
        </p>
      </div>

      <!-- 底部版权 -->
      <div class="mt-8 pt-6 border-t border-border/30 text-center text-xs opacity-40 leading-relaxed">
        <div class="flex items-center justify-center flex-wrap gap-1">
          <span>© {{ new Date().getFullYear() }}</span>
          <span class="font-medium">{{ props.siteTitle }}</span>
          <span v-if="props.siteFooter">{{ props.siteFooter }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
