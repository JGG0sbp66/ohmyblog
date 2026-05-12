<!-- src/views/admin/components/posts/editor/content/menus/handle/states/HandleBlockState.vue -->
<script setup lang="ts">
import { GripVertical } from "lucide-vue-next";
import type { Component } from "vue";
import type { Editor } from "@tiptap/core";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import DropButton from "@/components/common/button/DropButton.vue";
import HandleBlockMenu from "./HandleBlockMenu.vue";

/**
 * HandleBlockState — 有内容行状态：[拖拽点] + [块类型图标（hover 展开菜单）]
 *
 * Props:
 * - icon  : 当前块类型对应的 Lucide 图标组件
 * - editor: Tiptap 编辑器实例，供菜单执行命令
 */
defineProps<{ icon: Component; editor: Editor }>();
defineEmits<{ gripDragStart: [event: DragEvent]; gripDragEnd: [] }>();
</script>

<template>
  <div class="flex items-center">
    <!-- 块类型图标：hover 展开类型菜单（远离内容侧） -->
    <DropButton trigger-class="" pop-offset="mt-2" bridge-height="h-2" placement="left-0">
      <template #trigger="{ active }">
        <ButtonSecondary :isActive="active" class="w-7 h-7 p-0 shrink-0">
          <component :is="icon" class="w-3.5 h-3.5" />
        </ButtonSecondary>
      </template>
      <template #content>
        <HandleBlockMenu :editor="editor" />
      </template>
    </DropButton>

    <!-- 拖拽手柄（draggable 启动 HTML5 DnD，由父组件配置 ProseMirror drag 状态） -->
    <ButtonSecondary
      draggable="true"
      class="w-6 h-7 p-0 shrink-0 cursor-grab"
      @dragstart="$emit('gripDragStart', $event)"
      @dragend="$emit('gripDragEnd')"
    >
      <GripVertical class="w-3.5 h-3.5" />
    </ButtonSecondary>
  </div>
</template>
