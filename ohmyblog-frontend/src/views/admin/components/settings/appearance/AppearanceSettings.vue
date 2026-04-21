<!-- src/views/admin/components/settings/AppearanceSettings.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import AppearancePreview from "./AppearancePreview.vue";
import AppearanceForm from "./AppearanceForm.vue";
import ViewportSelector from "./ViewportSelector.vue";

const { t } = useI18n();
const viewportMode = ref<'pc' | 'mobile'>('pc');
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-8 p-4 animate-fade-in min-h-0 flex-1">
    <!-- 左侧预览卡片 -->
    <div class="flex-1 flex flex-col gap-6 min-h-0">
      <AppearancePreview :viewport-mode="viewportMode" />
    </div>

    <!-- 右侧容器 -->
    <div class="flex flex-col gap-6 shrink-0">
      <!-- 操控设备卡片 -->
      <ViewportSelector 
        v-model="viewportMode" 
        class="animate-fade-in animate-delay-150"
      />

      <!-- 设置卡片 -->
      <AppearanceForm 
        class="animate-fade-in animate-delay-300"
      />
    </div>
  </div>
</template>
