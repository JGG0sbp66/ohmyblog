<!-- src/views/admin/pages/Settings.page.vue -->
<!-- TODO: 实现设置页面功能 -->
<script setup lang="ts">
import { ref, markRaw, computed, onMounted, onUnmounted } from "vue";
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

// HACK: 使用 isMounted 解决 Teleport 刷新时的竞态问题
// 由于 AdminHeader 容器可能在 Settings 组件挂载时还未渲染完成，
// 我们必须等到挂载后再开启 Teleport，否则会导致渲染失败。
const isMounted = ref(false);
onMounted(() => {
  isMounted.value = true;
});

// 在组件卸载时手动关闭，确保在路由切换前清理掉在 Header 中的 DOM 残留，
// 避免因为 Teleport 销毁异常导致路由跳转时视图不更新的问题。
onUnmounted(() => {
  isMounted.value = false;
});
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0">
    <!-- Teleport 到 AdminHeader 的中间区域 -->
    <Teleport to="#admin-header-center" v-if="isMounted">
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
