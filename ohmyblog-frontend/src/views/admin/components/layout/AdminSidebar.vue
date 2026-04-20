<!-- src/views/admin/components/layout/AdminSidebar.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { LayoutDashboard, PenLine, Mail, Settings } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import SidebarButton from "@/components/base/button/SidebarButton.vue";
import AdminUserInfo from "../user/AdminUserInfo.vue";

const isExpanded = ref(false);
const router = useRouter();
const route = useRoute();
const { t } = useLang();

// 按功能将菜单拆成三组：仪表盘、内容管理、系统设置。
const menuGroups = computed(() => [
  [
    {
      name: t("components.common.admin.AdminSidebar.nav.dashboard"),
      icon: LayoutDashboard,
      path: "/admin/dashboard",
      exact: true,
    },
  ],
  [
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
  ],
  [
    {
      name: t("components.common.admin.AdminSidebar.nav.settings"),
      icon: Settings,
      path: "/admin/settings",
    },
  ],
]);

type MenuItem = (typeof menuGroups.value)[number][number];

const handleNavClick = (path: string) => {
  router.push(path);
};

const isItemActive = (item: MenuItem) => {
  // 仪表盘使用精确匹配，其他菜单使用前缀匹配以覆盖子路由。
  if ("exact" in item && item.exact) {
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
      'bg-bg-card rounded-r-3xl shadow-sm py-6 flex flex-col items-start transition-all duration-300 animate-fade-in animate-delay-50',
      isExpanded ? 'w-48' : 'w-20',
    ]"
  >
    <nav class="flex flex-col gap-3 w-full px-3 flex-1">
      <template v-for="(group, groupIndex) in menuGroups" :key="groupIndex">
        <div class="flex flex-col gap-3">
          <SidebarButton
            v-for="item in group"
            :key="item.path"
            :icon="item.icon"
            :text="item.name"
            :isActive="isItemActive(item)"
            :isExpanded="isExpanded"
            @click="handleNavClick(item.path)"
          />
        </div>
        <!-- 组间分割线，颜色与整体主题保持一致并略微增强可见性。 -->
        <div
          v-if="groupIndex < menuGroups.length - 1"
          class="w-full border-t border-fg-muted/15"
        ></div>
      </template>
    </nav>

    <!-- 管理员信息区域 -->
    <AdminUserInfo :isExpanded="isExpanded" />
  </aside>
</template>
