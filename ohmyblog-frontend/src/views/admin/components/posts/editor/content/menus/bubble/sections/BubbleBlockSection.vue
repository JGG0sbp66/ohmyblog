<!-- src/views/admin/components/posts/editor/content/menus/bubble/sections/BubbleBlockSection.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { Editor } from "@tiptap/core";
import { Type } from "lucide-vue-next";
import GroupedDropButton from "@/components/common/button/GroupedDropButton.vue";
import type { DropdownItem } from "@/components/common/button/GroupedDropButton.vue";
import { useBlockCommands, type BlockCommand } from "../../block-commands";

/**
 * BubbleBlockSection — 气泡菜单区域一：文本块类型切换
 *
 * 命令源来自 useBlockCommands 注册表，按 group 字段（text/list/embed）
 * 自动分组渲染。新增块类型只需改注册表，无需改本文件。
 *
 * 文案用 labelOf（短文本，单行不撑高按钮）。
 */
const props = defineProps<{ editor: Editor }>();

const { commands, labelOf, findActive } = useBlockCommands();

/** 当前激活命令的图标，未激活时回退到正文图标 */
const currentIcon = computed(() => findActive(props.editor)?.icon ?? Type);

/** 按 group 字段分组成 [text[], list[], embed[]] 给 GroupedDropButton */
const groups = computed<DropdownItem[][]>(() => {
  const e = props.editor;
  const buckets: Record<BlockCommand["group"], BlockCommand[]> = {
    text: [],
    list: [],
    embed: [],
  };
  for (const cmd of commands) buckets[cmd.group].push(cmd);

  return ([buckets.text, buckets.list, buckets.embed] as const)
    .filter((g) => g.length > 0)
    .map((group) =>
      group.map<DropdownItem>((cmd) => ({
        label: labelOf(cmd),
        icon: cmd.icon,
        active: cmd.isActive(e),
        action: () => cmd.run(e),
      })),
    );
});
</script>

<template>
  <GroupedDropButton :icon="currentIcon" :groups="groups" />
</template>
