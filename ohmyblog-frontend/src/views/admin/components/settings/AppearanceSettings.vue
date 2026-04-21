<!-- src/views/admin/components/settings/AppearanceSettings.vue -->
<script setup lang="ts">
import AppearancePreview from "./AppearancePreview.vue";
import AppearanceForm from "./AppearanceForm.vue";
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-8 p-4 animate-fade-in">
    <!-- 左侧预览卡片 -->
    <AppearancePreview />

    <!-- 右侧设置卡片 -->
    <AppearanceForm />
  </div>
</template>
