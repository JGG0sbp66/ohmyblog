<!-- src/views/admin/pages/Settings.page.vue -->
<!-- TODO: 实现设置页面功能 -->
<script setup lang="ts">
import { ref, markRaw } from "vue";
import AppearanceSettings from "../components/settings/AppearanceSettings.vue";
import SiteSettings from "../components/settings/SiteSettings.vue";
import SettingsNav from "../components/settings/SettingsNav.vue";

const menuItems = [
  { id: 'appearance', name: '外观设置', component: markRaw(AppearanceSettings) },
  { id: 'site', name: '站点设置', component: markRaw(SiteSettings) },
];

const activeTab = ref('appearance');
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0">
    <!-- Teleport 到 AdminHeader 的中间区域 -->
    <Teleport to="#admin-header-center">
      <SettingsNav
        :menu-items="menuItems"
        v-model:active-tab="activeTab"
        class="animate-fade-in"
      />
    </Teleport>

    <!-- 主内容区 -->
    <div class="flex-1 bg-bg-card rounded-2xl p-8 shadow-sm border border-black/5 dark:border-white/5 overflow-y-auto">
      <transition name="fade" mode="out-in">
        <component :is="menuItems.find(i => i.id === activeTab)?.component" />
      </transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(5px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
