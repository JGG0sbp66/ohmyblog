<!-- src/views/admin/pages/Settings.page.vue -->
<!-- TODO: 实现设置页面功能 -->
<script setup lang="ts">
import { ref, markRaw, computed } from "vue";
import AppearanceSection from "../components/settings/sections/AppearanceSection.vue";
import SiteSection from "../components/settings/sections/SiteSection.vue";
import AdminSection from "../components/settings/sections/AdminSection.vue";
import SMTPSection from "../components/settings/sections/SMTPSection.vue";
import SettingsNav from "../components/settings/layout/SettingsNav.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

const menuItems = computed(() => [
  {
    id: "appearance",
    name: t("views.admin.Settings.nav.appearance"),
    component: markRaw(AppearanceSection),
  },
  {
    id: "site",
    name: t("views.admin.Settings.nav.site"),
    component: markRaw(SiteSection),
  },
  {
    id: "admin",
    name: t("views.admin.Settings.nav.admin"),
    component: markRaw(AdminSection),
  },
  {
    id: "smtp",
    name: t("views.admin.Settings.nav.smtp"),
    component: markRaw(SMTPSection),
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
