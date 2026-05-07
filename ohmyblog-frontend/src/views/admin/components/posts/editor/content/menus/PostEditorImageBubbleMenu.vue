<!-- src/views/admin/components/posts/editor/content/menus/PostEditorImageBubbleMenu.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import type { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import IconTipButton from "@/components/common/button/IconTipButton.vue";

/**
 * PostEditorImageBubbleMenu — 图片节点专属气泡菜单
 *
 * 仅在 NodeSelection 选中 image 节点时显示。
 * 提供左 / 居中 / 右对齐，通过 setTextAlign 控制父段落对齐。
 */
const props = defineProps<{
  editor: Editor;
  containerRef?: HTMLElement | null;
}>();

const { t } = useLang();

const isVisible = ref(false);
const menuStyle = ref<Record<string, string>>({});
const menuRef = ref<HTMLElement | null>(null);

const updateMenu = () => {
  const { selection } = props.editor.state;

  if (
    !(selection instanceof NodeSelection) ||
    selection.node.type.name !== "image"
  ) {
    isVisible.value = false;
    return;
  }

  // 取选中图片节点对应的 DOM 元素定位
  const domNode = props.editor.view.nodeDOM(selection.from) as HTMLElement | null;
  if (!domNode) {
    isVisible.value = false;
    return;
  }

  const rect = domNode.getBoundingClientRect();
  let top = rect.top;
  let left = rect.left + rect.width / 2;

  if (props.containerRef) {
    const containerRect = props.containerRef.getBoundingClientRect();
    top = top - containerRect.top;
    left = left - containerRect.left;
  }

  menuStyle.value = {
    top: `${top - 10}px`,
    left: `${left}px`,
    transform: "translate(-50%, -100%)",
  };
  isVisible.value = true;
};

const hideMenu = ({ event }: { editor: Editor; event: FocusEvent }) => {
  if (
    menuRef.value &&
    event.relatedTarget instanceof Node &&
    menuRef.value.contains(event.relatedTarget)
  ) {
    return;
  }
  isVisible.value = false;
};

const onScrollOrResize = () => {
  if (isVisible.value) updateMenu();
};

onMounted(() => {
  props.editor.on("selectionUpdate", updateMenu);
  props.editor.on("blur", hideMenu);
  window.addEventListener("scroll", onScrollOrResize, true);
  window.addEventListener("resize", onScrollOrResize);
});

onBeforeUnmount(() => {
  props.editor.off("selectionUpdate", updateMenu);
  props.editor.off("blur", hideMenu);
  window.removeEventListener("scroll", onScrollOrResize, true);
  window.removeEventListener("resize", onScrollOrResize);
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
