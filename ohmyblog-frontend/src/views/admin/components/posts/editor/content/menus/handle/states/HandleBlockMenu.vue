<!-- src/views/admin/components/posts/editor/content/menus/handle/states/HandleBlockMenu.vue -->
<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import { HANDLE_MENU_GROUPS } from "../handle-menu-groups";
import HandleMenuGroup from "./HandleMenuGroup.vue";

/**
 * HandleBlockMenu — 浮动手柄的块插入菜单（分组，飞书风格）
 *
 * 分类真源在 handle-menu-groups.ts（基础 / 常用 / 列表），与气泡菜单的
 * block-commands.group 解耦。本组件只负责遍历分组渲染，单组交给 HandleMenuGroup。
 */
defineProps<{ editor: Editor }>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <HandleMenuGroup
      v-for="group in HANDLE_MENU_GROUPS"
      :key="group.labelKey"
      :editor="editor"
      :group="group"
    />
  </div>
</template>
