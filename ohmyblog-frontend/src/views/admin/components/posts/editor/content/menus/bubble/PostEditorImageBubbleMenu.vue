<!-- src/views/admin/components/posts/editor/content/menus/bubble/PostEditorImageBubbleMenu.vue -->
<script setup lang="ts">
import { toRef } from "vue";
import type { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import { useBubbleAnchor } from "./composables/use-bubble-anchor";

/**
 * PostEditorImageBubbleMenu — 图片节点专属气泡菜单
 *
 * 触发条件：NodeSelection 选中 image 节点。
 * 锚点：图片 NodeView 的 DOM 矩形。
 * 提供左 / 居中 / 右对齐，通过 setTextAlign 控制父段落对齐。
 */
const props = defineProps<{
  editor: Editor;
  containerRef?: HTMLElement | null;
}>();

const { t } = useLang();

const { menuRef, isVisible, menuStyle } = useBubbleAnchor(props.editor, {
  containerRef: toRef(props, "containerRef"),
  computeAnchorRect: (editor) => {
    const { selection } = editor.state;
    if (
      !(selection instanceof NodeSelection) ||
      selection.node.type.name !== "image"
    ) {
      return null;
    }
    const domNode = editor.view.nodeDOM(selection.from) as HTMLElement | null;
    return domNode?.getBoundingClientRect() ?? null;
  },
});
</script>

<template>
  <Transition
    enter-from-class="opacity-0 scale-95 translate-y-1"
    leave-to-class="opacity-0 scale-95 translate-y-1"
  >
    <div
      v-if="isVisible"
      ref="menuRef"
      class="absolute z-50 pointer-events-auto flex items-center gap-0.5 px-2 py-1.5 bg-bg-card border border-border/40 rounded-xl shadow-lg origin-bottom"
      :style="menuStyle"
    >
      <IconTipButton
        :tooltip="t('views.admin.PostEditor.content.bubbleMenu.alignLeft')"
        :isActive="editor.isActive({ textAlign: 'left' })"
        @click="editor.chain().focus().setTextAlign('left').run()"
      >
        <AlignLeft class="w-4 h-4" />
      </IconTipButton>

      <IconTipButton
        :tooltip="t('views.admin.PostEditor.content.bubbleMenu.alignCenter')"
        :isActive="editor.isActive({ textAlign: 'center' })"
        @click="editor.chain().focus().setTextAlign('center').run()"
      >
        <AlignCenter class="w-4 h-4" />
      </IconTipButton>

      <IconTipButton
        :tooltip="t('views.admin.PostEditor.content.bubbleMenu.alignRight')"
        :isActive="editor.isActive({ textAlign: 'right' })"
        @click="editor.chain().focus().setTextAlign('right').run()"
      >
        <AlignRight class="w-4 h-4" />
      </IconTipButton>
    </div>
  </Transition>
</template>
