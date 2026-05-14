<!-- src/views/admin/components/posts/editor/content/menus/handle/states/HandleEmptyState.vue -->
<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import type { Editor } from "@tiptap/core";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import DropButton from "@/components/common/button/DropButton.vue";
import HandleBlockMenu from "./HandleBlockMenu.vue";

/**
 * HandleEmptyState — 空行状态：[+] 图标，hover 展开块类型选择菜单
 */
defineProps<{ editor: Editor }>();
</script>

<template>
  <DropButton
    trigger-class=""
    pop-offset="mt-2"
    bridge-height="h-2"
    placement="left-0"
  >
    <template #trigger="{ active }">
      <ButtonSecondary :isActive="active" class="w-7 h-7 p-0 shrink-0">
        <Plus class="w-3.5 h-3.5" />
      </ButtonSecondary>
    </template>
    <template #content>
      <HandleBlockMenu :editor="editor" />
    </template>
  </DropButton>
</template>
