<!-- src/views/admin/components/settings/sections/AppearanceSection.vue -->
<script setup lang="ts">
import { ref } from "vue";
import SettingsPageLayout from "../../layout/SettingsPageLayout.vue";
import AppearancePreview from "./AppearancePreview.vue";
import AppearanceForm from "./AppearanceForm.vue";
import ViewportSelector from "./ViewportSelector.vue";

const viewportMode = ref<"pc" | "mobile">("pc");
</script>

<template>
  <SettingsPageLayout>
    <!-- 左侧：预览区域 -->
    <template #preview>
      <AppearancePreview :viewport-mode="viewportMode" class="flex-1" />
    </template>

    <!-- 右侧：配置内容 -->
    <ViewportSelector
      v-model="viewportMode"
      class="onload-animation anim-delay-100"
    />

    <AppearanceForm class="onload-animation anim-delay-150" />
  </SettingsPageLayout>
</template>
