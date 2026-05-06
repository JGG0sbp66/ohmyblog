<!-- src/views/admin/pages/posts/PostEditor.page.vue -->
<script setup lang="ts">
import { ref } from "vue";
import BaseCard from "@/components/base/card/BaseCard.vue";
import PostEditorStatusBar from "@/views/admin/components/posts/editor/PostEditorStatusBar.vue";
import PostEditorContent from "@/views/admin/components/posts/editor/PostEditorContent.vue";
import PostEditorSettingsPanel from "@/views/admin/components/posts/editor/PostEditorSettingsPanel.vue";
import { usePostEditor } from "@/composables/post-editor.hook";

const showSettings = ref(true);
const { slug, tags, status, title, content, contentMarkdown, contentText, isSaving, isDirty, save } = usePostEditor();
</script>

<template>
  <BaseCard padding="none" class="flex-1 flex overflow-hidden">
    <!-- 左侧编辑区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <PostEditorStatusBar
        :settingsOpen="showSettings"
        :loading="isSaving"
        :isDirty="isDirty"
        @toggle-settings="showSettings = !showSettings"
        @save="save"
      />
      <PostEditorContent
        v-model:title="title"
        v-model:content="content"
        v-model:contentMarkdown="contentMarkdown"
        v-model:contentText="contentText"
      />
    </div>

    <!-- 右侧设置面板 wrapper：过渡 width 代替 max-width，避免 reflow 卡顿 -->
    <div
      class="shrink-0 overflow-hidden"
      :style="{
        width: showSettings ? '18rem' : '0',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }"
    >
      <PostEditorSettingsPanel
        v-model:slug="slug"
        v-model:tags="tags"
        v-model:status="status"
      />
    </div>
  </BaseCard>
</template>
