<!-- src/views/admin/components/layout/AdminSidebar.vue -->
<!--
  ============================================================================
  TODO[移动端适配 · 侧边栏]：当前侧边栏靠 hover 展开（w-20 ↔ w-52，@mouseenter/@mouseleave），
  触屏没有 hover，这套交互在手机上完全失效，需要改成「抽屉(Drawer)」形态：

  - 桌面端（md 及以上）：保留现有 hover 展开逻辑不变。
  - 移动端（< md）：
      1. 默认隐藏（如 max-md:hidden 或 fixed + -translate-x-full）；
      2. 由 AdminLayout 的 isMobileMenuOpen 控制显隐：打开时 translate-x-0 滑入，
         并在侧边栏外铺一层半透明遮罩（点遮罩关闭）；
      3. 抽屉态下宽度应固定为展开宽度（w-52 左右），而不是 w-20；
      4. 点击任意菜单项后调用 handleNavClick 的同时关闭抽屉（emit('close') 给父组件）。
  - isExpanded 这个 hover 状态在移动端应被 isMobileMenuOpen 接管，避免两套状态打架。
  - z-index：抽屉 + 遮罩需高于主内容（参考现有 header 的 z-50）。
  ============================================================================
-->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useRouter, useRoute } from "vue-router";
import { LayoutDashboard, Mail, Settings, Link2 } from "lucide-vue-next";
import { RiQuillPenLine } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import SidebarButton from "@/components/base/button/SidebarButton.vue";
import AdminUserInfo from "../AdminUserInfo.vue";
import { useEmailStore } from "@/stores/email.store";
import { useFriendLinkStore } from "@/stores/friend-link.store";

const isExpanded = ref(false);
const router = useRouter();
const route = useRoute();
const { t } = useLang();

const emailStore = useEmailStore();
const { unreadCount: emailUnreadCount } = storeToRefs(emailStore);

const friendLinkStore = useFriendLinkStore();
const { pendingCount: friendLinkPendingCount } = storeToRefs(friendLinkStore);

onMounted(() => {
  emailStore.fetchUnreadCount();
  friendLinkStore.fetchPendingCount();
});

// 按功能将菜单拆成三组：仪表盘、内容管理、系统设置。
const menuGroups = computed(() => [
  [
    {
      name: t("components.common.admin.AdminHeader.pages.dashboard"),
      icon: LayoutDashboard,
      path: "/admin/dashboard",
      exact: true,
    },
  ],
  [
    {
      name: t("components.common.admin.AdminHeader.pages.posts"),
      icon: RiQuillPenLine,
      path: "/admin/posts",
    },
    {
      name: t("components.common.admin.AdminHeader.pages.emails"),
      icon: Mail,
      path: "/admin/emails",
    },
    {
      name: t("components.common.admin.AdminHeader.pages.friend-links"),
      icon: Link2,
      path: "/admin/friend-links",
    },
  ],
  [
    {
      name: t("components.common.admin.AdminHeader.pages.settings"),
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
      'bg-bg-card rounded-r-3xl shadow-sm py-6 flex flex-col items-start onload-animation anim-delay-50',
      isExpanded ? 'w-52' : 'w-20',
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
            :badge="
              item.path === '/admin/emails'
                ? emailUnreadCount
                : item.path === '/admin/friend-links'
                  ? friendLinkPendingCount
                  : undefined
            "
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
