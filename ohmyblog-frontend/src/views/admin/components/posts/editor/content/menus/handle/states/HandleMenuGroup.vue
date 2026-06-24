<!-- src/views/admin/components/posts/editor/content/menus/handle/states/HandleMenuGroup.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { Editor } from "@tiptap/core";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import { useLang } from "@/composables/lang.hook";
import {
  useBlockCommands,
  type BlockCommand,
  type BlockCommandId,
} from "../../block-commands";
import type { HandleMenuGroup } from "../handle-menu-groups";
import HandleTableMenuItem from "./HandleTableMenuItem.vue";

/**
 * HandleMenuGroup — handle 弹窗的单个分类（组标题 + 图标网格）
 *
 * 按 entry.type 渲染：command → IconTipButton（取自块命令注册表）；
 * table → HandleTableMenuItem（带网格弹层）。
 */
const props = defineProps<{ editor: Editor; group: HandleMenuGroup }>();

const { t } = useLang();
const { commands, tooltipOf } = useBlockCommands();
const byId = new Map<BlockCommandId, BlockCommand>(
  commands.map((c) => [c.id, c]),
);

const title = computed(() =>
  t(`views.admin.PostEditor.content.handleMenu.groups.${props.group.labelKey}`),
);

/** 解析配置条目：过滤掉找不到的命令，归一成可直接渲染的结构 */
type Resolved =
  | { key: string; kind: "table" }
  | { key: string; kind: "command"; cmd: BlockCommand };

const resolved = computed<Resolved[]>(() =>
  props.group.entries.flatMap((entry, i) => {
    if (entry.type === "table") return [{ key: `table-${i}`, kind: "table" }];
    const cmd = byId.get(entry.id);
    return cmd ? [{ key: entry.id, kind: "command" as const, cmd }] : [];
  }),
);
</script>

<template>
  <div>
    <div class="px-1.5 pb-1 text-xs text-fg-soft select-none">{{ title }}</div>
    <div class="grid grid-cols-4 gap-0.5">
      <template v-for="entry in resolved" :key="entry.key">
        <HandleTableMenuItem v-if="entry.kind === 'table'" :editor="editor" />
        <IconTipButton
          v-else
          :tooltip="tooltipOf(entry.cmd)"
          :isActive="entry.cmd.isActive(editor)"
          size="w-8 h-8"
          @click="entry.cmd.run(editor)"
        >
          <component :is="entry.cmd.icon" class="w-5 h-5" />
        </IconTipButton>
      </template>
    </div>
  </div>
</template>
