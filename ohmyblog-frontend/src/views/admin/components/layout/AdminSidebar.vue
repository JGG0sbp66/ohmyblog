<!-- src/views/admin/components/layout/AdminSidebar.vue -->
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRouter, useRoute } from "vue-router";
import { onKeyStroke, useScrollLock } from "@vueuse/core";
import { LayoutDashboard, Link2, Mail, Settings, X } from "lucide-vue-next";
import { RiQuillPenLine } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import { useIsMobile } from "@/composables/breakpoint.hook";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import SidebarButton from "@/components/base/button/SidebarButton.vue";
import AdminUserInfo from "../AdminUserInfo.vue";
import { useEmailStore } from "@/stores/email.store";
import { useFriendLinkStore } from "@/stores/friend-link.store";

const props = defineProps<{
  mobileOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const isExpanded = ref(false);
const isMobile = useIsMobile();
const drawerRef = ref<HTMLElement | null>(null);
const router = useRouter();
const route = useRoute();
const { t } = useLang();

// 移动端始终使用完整展开形态，桌面端继续由 hover 状态控制。
const isSidebarExpanded = computed(() => isMobile.value || isExpanded.value);

const emailStore = useEmailStore();
const { unreadCount: emailUnreadCount } = storeToRefs(emailStore);

const friendLinkStore = useFriendLinkStore();
const { pendingCount: friendLinkPendingCount } = storeToRefs(friendLinkStore);

onMounted(() => {
  emailStore.fetchUnreadCount();
  friendLinkStore.fetchPendingCount();
});

// 抽屉打开时锁定页面滚动，切回桌面断点时自动解除。
const isScrollLocked = useScrollLock(document.body);
watch(
  [() => props.mobileOpen, isMobile],
  ([mobileOpen, mobile]) => {
    isScrollLocked.value = mobileOpen && mobile;
  },
  { immediate: true },
);

// 断点切换时重置桌面 hover 展开态：从 hover 展开状态直接切到移动端时，
// mouseleave 可能因节点被 Teleport 移走而不触发，导致回到桌面后仍是展开态。
watch(isMobile, () => {
  isExpanded.value = false;
});

const close = () => emit("close");

onKeyStroke("Escape", () => {
  if (isMobile.value && props.mobileOpen) close();
});

// ── 移动抽屉的模态焦点行为 ──────────────────────────────────────────────
// 打开时把焦点移入抽屉、把后台内容标记为 inert；关闭后归还焦点给触发按钮。
let lastFocused: HTMLElement | null = null;

const getFocusable = () => {
  if (!drawerRef.value) return [] as HTMLElement[];
  return Array.from(
    drawerRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.offsetParent !== null);
};

watch(
  () => isMobile.value && props.mobileOpen,
  (active) => {
    const appRoot = document.getElementById("app");
    if (active) {
      lastFocused = document.activeElement as HTMLElement | null;
      // 抽屉 Teleport 到 body，与 #app 同级；将 #app 设为 inert 即可隔离后台内容。
      appRoot?.setAttribute("inert", "");
      nextTick(() => getFocusable()[0]?.focus());
    } else {
      appRoot?.removeAttribute("inert");
      if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
      lastFocused = null;
    }
  },
);

// 将 Tab 焦点约束在抽屉内循环。
onKeyStroke("Tab", (e) => {
  if (!(isMobile.value && props.mobileOpen)) return;
  const focusable = getFocusable();
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

// 组件卸载时兜底清除 inert，避免任何残留状态锁死后台内容。
onUnmounted(() => {
  document.getElementById("app")?.removeAttribute("inert");
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
  close();
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
  <!-- 桌面端禁用 Teleport，侧栏留在布局流中；移动端挂到 body 避免被 overflow 裁切。 -->
  <Teleport to="body" :disabled="!isMobile">
    <Transition name="admin-drawer-fade">
      <div
        v-if="isMobile && mobileOpen"
        class="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm md:hidden"
        aria-hidden="true"
        @click="close"
      />
    </Transition>

    <Transition name="admin-drawer-slide">
      <aside
        v-if="!isMobile || mobileOpen"
        ref="drawerRef"
        :role="isMobile ? 'dialog' : undefined"
        :aria-modal="isMobile ? true : undefined"
        :aria-label="t('components.common.layout.Header.menu.title')"
        :style="
          isMobile
            ? {
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }
            : undefined
        "
        :class="[
          'flex flex-col items-start bg-bg-card transition-[width] duration-300',
          isMobile
            ? 'fixed inset-y-0 left-0 z-61 w-72 max-w-[85vw] shadow-xl'
            : 'relative mb-4 rounded-r-3xl py-6 shadow-sm onload-animation anim-delay-50',
          !isMobile && (isExpanded ? 'w-52' : 'w-20'),
        ]"
        @mouseenter="!isMobile && (isExpanded = true)"
        @mouseleave="!isMobile && (isExpanded = false)"
      >
        <!-- 移动抽屉标题和显式关闭入口 -->
        <div
          v-if="isMobile"
          class="flex h-18 w-full shrink-0 items-center justify-between border-b border-fg-muted/10 px-4"
        >
          <span class="text-base font-semibold text-fg">
            {{ t("components.common.layout.Header.menu.title") }}
          </span>
          <div class="h-11 w-11">
            <ButtonSecondary
              class="h-full w-full"
              :aria-label="t('components.common.layout.Header.menu.close')"
              @click="close"
            >
              <X class="h-5 w-5" />
            </ButtonSecondary>
          </div>
        </div>

        <nav
          :class="[
            'flex w-full flex-1 flex-col gap-3 px-3',
            isMobile ? 'overflow-y-auto py-3' : '',
          ]"
        >
          <template v-for="(group, groupIndex) in menuGroups" :key="groupIndex">
            <div class="flex flex-col gap-3">
              <SidebarButton
                v-for="item in group"
                :key="item.path"
                :icon="item.icon"
                :text="item.name"
                :isActive="isItemActive(item)"
                :isExpanded="isSidebarExpanded"
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
        <AdminUserInfo
          :isExpanded="isSidebarExpanded"
          :class="isMobile ? 'pb-6' : ''"
        />
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.admin-drawer-fade-enter-active,
.admin-drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}

.admin-drawer-fade-enter-from,
.admin-drawer-fade-leave-to {
  opacity: 0;
}

.admin-drawer-slide-enter-active,
.admin-drawer-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-drawer-slide-enter-from,
.admin-drawer-slide-leave-to {
  transform: translateX(-100%);
}
</style>
