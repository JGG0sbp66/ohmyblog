<!-- src/views/admin/components/settings/sections/AppearanceSection.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useIsMobile } from "@/composables/breakpoint.hook";
import SettingsPageLayout from "../../layout/SettingsPageLayout.vue";
import AppearancePreview from "./AppearancePreview.vue";
import AppearanceForm from "./AppearanceForm.vue";
import AnnouncementForm from "./AnnouncementForm.vue";
import ViewportSelector from "./ViewportSelector.vue";

// 移动端屏幕本身即移动尺寸，实时预览恒为移动端样式、无参考意义，直接隐藏。
const isMobile = useIsMobile();
const viewportMode = ref<"pc" | "mobile">("pc");
</script>

<template>
  <SettingsPageLayout>
    <!-- 左侧：预览区域（移动端由布局统一隐藏，不渲染 iframe） -->
    <template #preview>
      <AppearancePreview :viewport-mode="viewportMode" class="flex-1" />
    </template>

    <!-- 右侧：配置内容 -->
    <ViewportSelector
      v-if="!isMobile"
      v-model="viewportMode"
      class="onload-animation anim-delay-100"
    />

    <AppearanceForm class="onload-animation anim-delay-150" />

    <AnnouncementForm class="onload-animation anim-delay-200" />
  </SettingsPageLayout>
</template>
