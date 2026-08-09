<!-- src/views/admin/components/posts/editor/content/menus/mobile/MobileLinkButton.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import type { Editor } from "@tiptap/core";
import { Link } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import BasePop from "@/components/base/pop/BasePop.vue";

/**
 * MobileLinkButton — 工具条上的链接按钮（插入 / 编辑 / 移除）
 *
 * 行为逻辑和桌面端的 BubbleLinkButton 一模一样，但**没有复用它**，原因有两条，
 * 都是结构性的、加几个样式 prop 解决不了：
 *
 * 1. 那个组件把按钮包在 IconTipButton → BaseTooltip 里。BaseTooltip 的触发器是
 *    一层 auto 高度的 div，`h-full` 沿这条链路解析不到确定高度，按钮会被压成
 *    扁长方形；而工具条里其他按钮走的是「定尺寸容器 + h-full/w-full」，
 *    两种写法在同一条工具条里没法统一。触屏本来也不该有 hover 提示。
 * 2. 它的弹层朝下开（top-full），工具条贴在屏幕底部时会整个落到视口外。
 *
 * 弹层朝上开、并且左对齐：min-w-72 的输入框如果右对齐，在窄屏会溢出到视口左侧外。
 */
const props = defineProps<{ editor: Editor }>();

const { t } = useLang();

const isOpen = ref(false);
const linkUrl = ref("");
/** 弹窗打开时记录的原始 URL，用于判断用户是否修改过 */
const originalUrl = ref("");
/** 弹窗打开时链接是否已存在 */
const isLinkActive = ref(false);
const btnRef = ref<HTMLElement | null>(null);

/**
 * 移除模式：链接已存在 且 URL 未被手动修改
 * - true  → 按钮显示「移除链接」（红色）
 * - false → 按钮显示「插入」（主题色）
 */
const isRemoveMode = computed(
  () => isLinkActive.value && linkUrl.value === originalUrl.value,
);

const handleTrigger = () => {
  isLinkActive.value = props.editor.isActive("link");
  originalUrl.value = props.editor.getAttributes("link").href ?? "";
  linkUrl.value = originalUrl.value;
  isOpen.value = !isOpen.value;
};

const handleAction = () => {
  if (isRemoveMode.value) {
    props.editor.chain().focus().unsetLink().run();
  } else if (linkUrl.value) {
    props.editor.chain().focus().setLink({ href: linkUrl.value }).run();
  }
  isOpen.value = false;
};
</script>

<template>
  <!-- relative 是弹层的定位锚点；尺寸由这层给，按钮再 h-full/w-full 撑满，
       与工具条其它按钮完全一致 -->
  <div ref="btnRef" class="relative h-10 w-10">
    <ButtonSecondary
      class="h-full! w-full! p-0!"
      :is-active="editor.isActive('link') || isOpen"
      :aria-label="
        editor.isActive('link')
          ? t('views.admin.PostEditor.content.bubbleMenu.linkEdit')
          : t('views.admin.PostEditor.content.bubbleMenu.link')
      "
      @click="handleTrigger"
    >
      <Link class="h-5 w-5" />
    </ButtonSecondary>

    <BasePop
      v-model="isOpen"
      :trigger-ref="btnRef"
      class="bottom-full left-0 mb-3 min-w-72 border border-border/40 p-2"
    >
      <div
        class="flex items-center gap-2"
        @keydown.enter.prevent="handleAction"
      >
        <TipInput
          v-model="linkUrl"
          type="url"
          :placeholder="
            t('views.admin.PostEditor.content.bubbleMenu.linkUrlPlaceholder')
          "
        />
        <ButtonPrimary
          :class="isRemoveMode ? 'bg-red-500 hover:bg-red-600' : ''"
          :text="
            isRemoveMode
              ? t('views.admin.PostEditor.content.bubbleMenu.linkRemove')
              : t('views.admin.PostEditor.content.bubbleMenu.linkConfirm')
          "
          @click="handleAction"
        />
      </div>
    </BasePop>
  </div>
</template>
