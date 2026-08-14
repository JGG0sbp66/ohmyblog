<!-- src/views/admin/pages/Security.page.vue -->
<!--
  「安全」页面。
  左右布局：左侧 BrowserMockup 多 tab 预览入口页面，右侧配置表单可滚动。
  移动端隐藏预览，表单占满。
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import BrowserMockup from "@/components/common/container/BrowserMockup.vue";
import type { BrowserTab } from "@/components/common/container/BrowserMockup.vue";
import CaptchaSettingsForm from "../components/security/CaptchaSettingsForm.vue";
import { useIsMobile } from "@/composables/breakpoint.hook";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();
const isMobile = useIsMobile();

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
  <div class="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 onload-animation">
    <!-- 左侧：BrowserMockup 预览（移动端不渲染） -->
    <div v-if="!isMobile" class="flex-1 flex flex-col min-h-0">
      <BrowserMockup v-model="activeTab" :tabs="tabs" :srcs="previewSrcs" />
    </div>

    <!-- 右侧：配置表单区域，可滚动 -->
    <div class="flex-1 lg:flex-none lg:w-120 flex flex-col min-h-0 relative">
      <div
        class="absolute inset-0 overflow-y-auto overflow-x-hidden -mx-6 px-6 -mb-6 pb-6 scroll-smooth"
      >
        <CaptchaSettingsForm @scene-focus="activeTab = $event" />
      </div>
    </div>
  </div>
</template>
