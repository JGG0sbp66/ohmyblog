<!-- src/views/admin/components/settings/layout/SiteLayout.vue -->
<script setup lang="ts">
import SitePreview from "../site/SitePreview.vue";
import HeroSettingsForm from "../site/HeroSettingsForm.vue";
import SiteInfoForm from "../site/SiteInfoForm.vue";
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-8 onload-animation min-h-0 flex-1">
    <!-- 左侧：实时预览区域 -->
    <div class="flex-1 flex flex-col gap-6 min-h-0">
      <SitePreview class="flex-1" />
    </div>

    <!-- 右侧：配置表单区域 -->
    <div class="flex flex-col gap-6 shrink-0 h-full overflow-y-auto py-1 pr-1">
      <!-- 站点信息表单 -->
      <SiteInfoForm class="onload-animation anim-delay-50" />

      <!-- Hero 配置表单 -->
      <HeroSettingsForm class="onload-animation anim-delay-100" />
    </div>
  </div>
</template>

<style scoped></style>
