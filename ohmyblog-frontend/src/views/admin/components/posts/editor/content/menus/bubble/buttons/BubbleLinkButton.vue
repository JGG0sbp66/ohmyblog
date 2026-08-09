<!-- src/views/admin/components/posts/editor/content/menus/bubble/buttons/BubbleLinkButton.vue -->
<script setup lang="ts">
import { ref } from "vue";
import type { Editor } from "@tiptap/core";
import { Link } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BasePop from "@/components/base/pop/BasePop.vue";
import { useLinkEditing } from "../../../composables/use-link-editing";

/**
 * BubbleLinkButton — 气泡菜单里的链接按钮（桌面端）
 *
 * 状态机在 useLinkEditing，与移动端 MobileLinkButton 共用；本组件只保留桌面端外观
 * （IconTipButton 的 hover 提示 + 朝下开的弹层）。
 */
const props = defineProps<{ editor: Editor }>();
const { t } = useLang();

const btnRef = ref<HTMLElement | null>(null);
const { isOpen, linkUrl, isRemoveMode, toggle, apply } = useLinkEditing(
  () => props.editor,
);
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
      @click="toggle"
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
      <div class="flex items-center gap-2" @keydown.enter.prevent="apply">
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
          @click="apply"
        />
      </div>
    </BasePop>
  </div>
</template>
