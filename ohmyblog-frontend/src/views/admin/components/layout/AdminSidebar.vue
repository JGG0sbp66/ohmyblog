<!-- src/views/admin/components/layout/AdminSidebar.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { LayoutDashboard, PenLine, Mail, Settings } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import SidebarButton from "@/components/base/button/SidebarButton.vue";

const isExpanded = ref(false);
const router = useRouter();
const route = useRoute();
const { t } = useLang();

const menuItems = computed(() => [
  {
    name: t("components.common.admin.AdminSidebar.nav.dashboard"),
    icon: LayoutDashboard,
    path: "/admin/dashboard",
    exact: true,
  },
  {
    name: t("components.common.admin.AdminSidebar.nav.posts"),
    icon: PenLine,
    path: "/admin/posts",
  },
  {
    name: t("components.common.admin.AdminSidebar.nav.emails"),
    icon: Mail,
    path: "/admin/emails",
  },
  {
    name: t("components.common.admin.AdminSidebar.nav.settings"),
    icon: Settings,
    path: "/admin/settings",
  },
]);

const handleNavClick = (path: string) => {
  router.push(path);
};

const isItemActive = (item: (typeof menuItems.value)[0]) => {
  if (item.exact) {
    return route.path === item.path;
  }
  return route.path.startsWith(item.path);
};
</script>

<template>
  <aside
    @mouseenter="isExpanded = true"
    @mouseleave="isExpanded = false"
    :class="[
      'bg-bg-card rounded-r-3xl shadow-sm py-6 flex flex-col items-start transition-all duration-300',
      isExpanded ? 'w-48' : 'w-20',
    ]"
  >
    <nav class="flex flex-col gap-3 w-full px-3">
      <SidebarButton
        v-for="item in menuItems"
        :key="item.path"
        :icon="item.icon"
        :text="item.name"
        :isActive="isItemActive(item)"
        :isExpanded="isExpanded"
        @click="handleNavClick(item.path)"
      />
    </nav>
  </aside>
</template>
