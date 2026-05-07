<!-- src/views/admin/components/posts/editor/content/menus/bubble/BubbleAlignSection.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { Editor } from "@tiptap/core";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  IndentIncrease,
  IndentDecrease,
} from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import GroupedDropButton from "@/components/common/button/GroupedDropButton.vue";
import type { DropdownItem } from "@/components/common/button/GroupedDropButton.vue";

/**
 * BubbleAlignSection — 气泡菜单区域二：对齐与缩进
 *
 * 显示当前对齐方式图标，hover 后展开下拉菜单，
 * 支持：左对齐 / 居中 / 右对齐 / 增加缩进 / 减少缩进
 */
const props = defineProps<{ editor: Editor }>();
const { t } = useLang();

const currentIcon = computed(() => {
  const e = props.editor;
  if (e.isActive({ textAlign: "center" })) return AlignCenter;
  if (e.isActive({ textAlign: "right" })) return AlignRight;
  return AlignLeft;
});

const groups = computed<DropdownItem[][]>(() => {
  const e = props.editor;
  return [
    [
      {
        label: t("views.admin.PostEditor.content.bubbleMenu.alignLeft"),
        icon: AlignLeft,
        active: e.isActive({ textAlign: "left" }),
        action: () => e.chain().focus().setTextAlign("left").run(),
      },
      {
        label: t("views.admin.PostEditor.content.bubbleMenu.alignCenter"),
        icon: AlignCenter,
        active: e.isActive({ textAlign: "center" }),
        action: () => e.chain().focus().setTextAlign("center").run(),
      },
      {
        label: t("views.admin.PostEditor.content.bubbleMenu.alignRight"),
        icon: AlignRight,
        active: e.isActive({ textAlign: "right" }),
        action: () => e.chain().focus().setTextAlign("right").run(),
      },
    ],
    [
      {
        label: t("views.admin.PostEditor.content.bubbleMenu.indent"),
        icon: IndentIncrease,
        active: false,
        disabled: !e.can().indent(),
        action: () => e.chain().focus().indent().run(),
      },
      {
        label: t("views.admin.PostEditor.content.bubbleMenu.outdent"),
        icon: IndentDecrease,
        active: false,
        disabled: !e.can().outdent(),
        action: () => e.chain().focus().outdent().run(),
      },
    ],
  ];
});
</script>

<template>
  <GroupedDropButton :icon="currentIcon" :groups="groups" />
</template>
