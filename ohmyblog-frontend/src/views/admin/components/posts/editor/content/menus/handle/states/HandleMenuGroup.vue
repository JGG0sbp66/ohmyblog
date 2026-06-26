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
 *
 * TODO(handle-menu-feishu-style): 菜单视觉优化（仿飞书）
 * - 现状：所有分组都用 grid-cols-4 的纯图标网格，信息密度高但不易辨识。
 * - 目标：分组差异化呈现——
 *   · 「基础」组（高频排版块：正文/H1~H3/代码/引用/分割线等）保持纯 icon 网格（紧凑）。
 *   · 其余组（常用 / 列表 等）改为「icon + 文字」的纵向条目（每项一行，仿飞书下拉项），
 *     更直观可读。
 * - icon 上色：给每个块命令配一个语义色（如标题=蓝、列表=绿、代码=紫…），图标按该色渲染，
 *   提升可扫视性。建议在 block-commands 注册表上加 color 字段（单一真源），本组件按 kind/分组
 *   决定「纯 icon」还是「icon+文字」两种布局。
 * - 注意：HandleTableMenuItem 的网格弹层交互需与新布局兼容；i18n 文案走现有 handleMenu key。
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
    <div class="px-1.5 pb-1 text-sm text-fg-soft select-none">{{ title }}</div>
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
