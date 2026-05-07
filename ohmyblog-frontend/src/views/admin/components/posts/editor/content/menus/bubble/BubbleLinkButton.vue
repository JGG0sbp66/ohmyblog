<!-- src/views/admin/components/posts/editor/content/menus/bubble/BubbleLinkButton.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import type { Editor } from "@tiptap/core";
import { Link } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BasePop from "@/components/base/pop/BasePop.vue";

const props = defineProps<{ editor: Editor }>();
const { t } = useLang();

const isOpen = ref(false);
const linkUrl = ref("");
const originalUrl = ref(""); // 弹窗打开时记录的原始 URL，用于判断用户是否修改过
const isLinkActive = ref(false); // 弹窗打开时链接是否已存在
const btnRef = ref<HTMLElement | null>(null);

/**
 * 移除模式：链接已存在 且 URL 未被手动修改
 * - true  → 按钮显示"移除链接"（红色）
 * - false → 按钮显示"插入"（主题色）
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

/** 插入或更新链接 */
const handleConfirm = () => {
  if (linkUrl.value) {
    props.editor.chain().focus().setLink({ href: linkUrl.value }).run();
  }
  isOpen.value = false;
};

/** 移除当前链接 */
const handleRemove = () => {
  props.editor.chain().focus().unsetLink().run();
  isOpen.value = false;
};

/** 根据当前模式路由到对应操作 */
const handleAction = () => {
  if (isRemoveMode.value) handleRemove();
  else handleConfirm();
};
</script>

<template>
  <div class="relative" ref="btnRef">
    <!-- 触发按钮：链接已存在时提示"编辑链接" -->
    <IconTipButton
      :tooltip="
        editor.isActive('link')
          ? t('views.admin.PostEditor.content.bubbleMenu.linkEdit')
          : t('views.admin.PostEditor.content.bubbleMenu.link')
      "
      :isActive="editor.isActive('link') || isOpen"
      @click="handleTrigger"
    >
      <Link class="w-4 h-4" />
    </IconTipButton>

    <!-- 链接编辑弹窗 -->
    <BasePop
      v-model="isOpen"
      :trigger-ref="btnRef"
      class="top-full right-0 mt-3 p-2 min-w-72 border border-border/40"
    >
      <!-- 左：URL 输入框；右：操作按钮（样式随状态切换） -->
      <div class="flex items-center gap-2" @keydown.enter.prevent="handleAction">
        <TipInput
          v-model="linkUrl"
          :placeholder="t('views.admin.PostEditor.content.bubbleMenu.linkUrlPlaceholder')"
        />
        <ButtonPrimary
          :class="isRemoveMode ? 'bg-red-500 hover:bg-red-600' : ''"
          :text="isRemoveMode
            ? t('views.admin.PostEditor.content.bubbleMenu.linkRemove')
            : t('views.admin.PostEditor.content.bubbleMenu.linkConfirm')"
          @click="handleAction"
        />
      </div>
    </BasePop>
  </div>
</template>
