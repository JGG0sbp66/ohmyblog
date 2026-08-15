<!-- src/views/admin/components/settings/sections/security/SecuritySection.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import BrowserMockup from "@/components/common/container/BrowserMockup.vue";
import type { BrowserTab } from "@/components/common/container/BrowserMockup.vue";
import CaptchaSettingsForm from "@/views/admin/components/security/CaptchaSettingsForm.vue";
import SettingsPageLayout from "../../layout/SettingsPageLayout.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

const activeTab = ref(0);

const tabs = computed<BrowserTab[]>(() => [
  { title: t("views.admin.Security.scenes.login.title") },
  { title: t("views.admin.Security.scenes.forgotPassword.title") },
  { title: t("views.admin.Security.scenes.friendApply.title") },
]);

const previewSrcs = computed(() => [
  window.location.origin + "/admin/login",
  window.location.origin + "/admin/forgot-password",
  window.location.origin + "/friends",
]);
</script>

<template>
  <SettingsPageLayout>
    <!-- 左侧：BrowserMockup 多 tab 预览 -->
    <template #preview>
      <BrowserMockup v-model="activeTab" :tabs="tabs" :srcs="previewSrcs" />
    </template>

    <!-- 右侧：配置表单 -->
    <CaptchaSettingsForm @scene-focus="activeTab = $event" />
  </SettingsPageLayout>
</template>
