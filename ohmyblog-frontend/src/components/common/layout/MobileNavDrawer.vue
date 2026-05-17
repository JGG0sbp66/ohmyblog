<!-- src/components/common/layout/MobileNavDrawer.vue -->
<!--
  移动端导航抽屉。
  - 由 Header 组件控制开关 (v-model)。
  - 渲染：仅站点导航项（主题 / 语言 / 设置等已直接放在 Header 右侧图标区）。
  - 桌面端不会渲染该组件（Header 内已用 md:hidden 控制入口）。
-->
<script lang="ts" setup>
import { watch, useTemplateRef } from "vue";
import { useRouter, useRoute } from "vue-router";
import { onClickOutside, useScrollLock } from "@vueuse/core";
import { X } from "lucide-vue-next";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useLang } from "@/composables/lang.hook";

const props = defineProps<{
  modelValue: boolean;
  navItems: { name: string; label: string }[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const router = useRouter();
const route = useRoute();
const { t } = useLang();

const panelRef = useTemplateRef<HTMLElement>("panelRef");

// 抽屉打开时锁定 body 滚动，避免背景跟随滚动。
const isLocked = useScrollLock(document.body);
watch(
  () => props.modelValue,
  (open) => {
    isLocked.value = open;
  },
);

const close = () => emit("update:modelValue", false);

// 点击面板外（即遮罩区域）时关闭抽屉。
onClickOutside(panelRef, () => {
  if (props.modelValue) close();
});

const handleNavClick = (name: string) => {
  close();
  router.push({ name });
};
</script>

<template>
  <Teleport to="body">
    <!-- 遮罩层 + 抽屉容器（fixed 全屏） -->
    <Transition name="drawer-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm md:hidden"
        aria-hidden="true"
      />
    </Transition>

    <Transition name="drawer-slide">
      <aside
        v-if="modelValue"
        ref="panelRef"
        role="dialog"
        aria-modal="true"
        :aria-label="t('components.common.layout.Header.menu.title')"
        class="fixed top-0 left-0 bottom-0 z-61 w-72 max-w-[85vw] bg-bg-card shadow-xl flex flex-col md:hidden"
        style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom)"
      >
        <!-- 顶部：标题 + 关闭按钮 -->
        <div
          class="h-18 shrink-0 px-4 flex items-center justify-between border-b border-fg-subtle/10"
        >
          <span class="text-base font-semibold text-fg">
            {{ t("components.common.layout.Header.menu.title") }}
          </span>
          <div class="w-11 h-11">
            <ButtonSecondary
              class="w-full h-full"
              :aria-label="t('components.common.layout.Header.menu.close')"
              @click="close"
            >
              <X class="w-5 h-5" />
            </ButtonSecondary>
          </div>
        </div>

        <!-- 导航项（大尺寸便于点按） -->
        <nav class="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          <div
            v-for="item in navItems"
            :key="item.name"
            class="w-full h-12 shrink-0"
          >
            <ButtonSecondary
              :text="item.label"
              :isActive="route.name === item.name"
              :aria-current="route.name === item.name ? 'page' : undefined"
              class="w-full h-full px-4 justify-start text-base"
              @click="handleNavClick(item.name)"
            />
          </div>
        </nav>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(-100%);
}
</style>
