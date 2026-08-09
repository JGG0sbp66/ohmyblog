<!-- src/views/admin/components/posts/editor/content/menus/mobile/MobileLinkButton.vue -->
<script setup lang="ts">
import { ref } from "vue";
import type { Editor } from "@tiptap/core";
import { Link } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import BasePop from "@/components/base/pop/BasePop.vue";
import { useLinkEditing } from "../../composables/use-link-editing";

/**
 * MobileLinkButton — 工具条上的链接按钮
 *
 * 状态机与桌面端 BubbleLinkButton 共用 useLinkEditing，这里只负责移动端特有的外观，
 * 而那些差异恰恰是没法共用模板的原因：
 * - 不经过 IconTipButton / BaseTooltip：触屏点一下会把 hover 提示永久挂在屏幕上，
 *   而且那层 auto 高度的包裹会让 h-full 解析不到确定高度、按钮被压成扁长方形
 * - 尺寸由 relative 容器给，按钮 h-full/w-full 撑满，与工具条其它按钮一致
 * - 弹层朝上开且左对齐：贴底工具条上朝下开会落到视口外，min-w-72 右对齐则会在
 *   窄屏溢出到视口左侧外
 */
const props = defineProps<{ editor: Editor }>();

const { t } = useLang();
const btnRef = ref<HTMLElement | null>(null);
const { isOpen, linkUrl, isRemoveMode, toggle, apply } = useLinkEditing(
  () => props.editor,
);
</script>

<template>
  <div ref="btnRef" class="relative h-10 w-10">
    <ButtonSecondary
      class="h-full! w-full! p-0!"
      :is-active="editor.isActive('link') || isOpen"
      :aria-label="
        editor.isActive('link')
          ? t('views.admin.PostEditor.content.bubbleMenu.linkEdit')
          : t('views.admin.PostEditor.content.bubbleMenu.link')
      "
      @click="toggle"
    >
      <Link class="h-5 w-5" />
    </ButtonSecondary>

    <BasePop
      v-model="isOpen"
      :trigger-ref="btnRef"
      class="bottom-full left-0 mb-3 min-w-72 border border-border/40 p-2"
    >
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
