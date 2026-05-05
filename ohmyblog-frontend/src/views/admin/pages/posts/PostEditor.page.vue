<!-- src/views/admin/pages/posts/PostEditor.page.vue -->
<script setup lang="ts">
import { ref } from "vue";
import BaseCard from "@/components/base/card/BaseCard.vue";
import PostEditorStatusBar from "@/views/admin/components/posts/editor/PostEditorStatusBar.vue";
import PostEditorContent from "@/views/admin/components/posts/editor/PostEditorContent.vue";
import PostEditorSettingsPanel from "@/views/admin/components/posts/editor/PostEditorSettingsPanel.vue";

const showSettings = ref(true);
</script>

<template>
  <BaseCard padding="none" class="flex-1 flex overflow-hidden">
    <!-- 左侧编辑区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <PostEditorStatusBar
        :settingsOpen="showSettings"
        @toggle-settings="showSettings = !showSettings"
      />
      <PostEditorContent />
    </div>

    <!-- 右侧设置面板 wrapper：过渡 width 代替 max-width，避免 reflow 卡顿 -->
    <div
      class="shrink-0 overflow-hidden"
      :style="{
        width: showSettings ? '18rem' : '0',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }"
    >
      <PostEditorSettingsPanel />
    </div>
  </BaseCard>
</template>
