<!-- src/views/admin/components/settings/sections/SiteSection.vue -->
<script setup lang="ts">
import SettingsPageLayout from "../../layout/SettingsPageLayout.vue";
import SitePreview from "./SitePreview.vue";
import HeroSettingsForm from "./HeroSettingsForm.vue";
import SiteInfoForm from "./SiteInfoForm.vue";
import FooterSettingsForm from "./FooterSettingsForm.vue";
</script>

<template>
  <SettingsPageLayout>
    <!-- 左侧：实时预览区域 -->
    <template #preview>
      <SitePreview class="flex-1" />
    </template>

    <!-- 右侧：配置内容 -->
    <SiteInfoForm class="onload-animation anim-delay-50" />

    <HeroSettingsForm class="onload-animation anim-delay-100" />

    <FooterSettingsForm class="onload-animation anim-delay-150" />
  </SettingsPageLayout>
</template>
