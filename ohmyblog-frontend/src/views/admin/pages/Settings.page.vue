<!-- src/views/admin/pages/Settings.page.vue -->
<!-- TODO: 实现设置页面功能 -->
<script setup lang="ts">
import { ref, markRaw, computed } from "vue";
import AppearanceLayout from "../components/settings/layout/AppearanceLayout.vue";
import SiteLayout from "../components/settings/layout/SiteLayout.vue";
import AdminLayout from "../components/settings/layout/AdminLayout.vue";
import SMTPLayout from "../components/settings/layout/SMTPLayout.vue";
import SettingsNav from "../components/settings/SettingsNav.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

const menuItems = computed(() => [
  {
    id: "appearance",
    name: t("views.admin.Settings.nav.appearance"),
    component: markRaw(AppearanceLayout),
  },
  {
    id: "site",
    name: t("views.admin.Settings.nav.site"),
    component: markRaw(SiteLayout),
  },
  {
    id: "admin",
    name: t("views.admin.Settings.nav.admin"),
    component: markRaw(AdminLayout),
  },
  {
    id: "smtp",
    name: t("views.admin.Settings.nav.smtp"),
    component: markRaw(SMTPLayout),
  },
]);

const activeTab = ref("appearance");
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0">
    <!-- Teleport 到 AdminHeader 的中间区域 -->
    <Teleport defer to="#admin-header-center">
      <SettingsNav
        :menu-items="menuItems"
        v-model:active-tab="activeTab"
        class="onload-animation"
      />
    </Teleport>

    <!-- 主内容区 -->
    <div class="flex-1 min-h-0 flex flex-col">
      <component
        :is="menuItems.find((i) => i.id === activeTab)?.component"
        class="flex-1"
      />
    </div>
  </div>
</template>

<style scoped></style>
