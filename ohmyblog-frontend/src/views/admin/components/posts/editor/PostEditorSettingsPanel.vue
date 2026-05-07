<!-- src/views/admin/components/posts/editor/PostEditorSettingsPanel.vue -->
<script setup lang="ts">
import PostEditorTagSetting from "@/views/admin/components/posts/editor/setting/PostEditorTagSetting.vue";
import PostEditorSlugSetting from "@/views/admin/components/posts/editor/setting/PostEditorSlugSetting.vue";
import PostEditorStatusSetting from "@/views/admin/components/posts/editor/setting/PostEditorStatusSetting.vue";
import { useLang } from "@/composables/lang.hook";
import type { TPostStatus } from "@server/db/constants/post.constants";

const { t } = useLang();

const slug = defineModel<string>("slug", { default: "" });
const tags = defineModel<string[]>("tags", { default: () => [] });
const status = defineModel<TPostStatus>("status", { default: "draft" });
</script>

<template>
  <div class="w-72 h-full shrink-0 border-l border-border/40 flex flex-col">
    <!-- 面板标题 -->
    <h2
      class="shrink-0 flex items-center px-5 pt-4 pb-3 border-b border-border/40"
    >
      <!-- h-9 与工具栏按钮等高，确保在任意 DPR 下两侧行高精确对齐 -->
      <span class="inline-flex items-center h-9 text-lg font-bold text-fg">
        {{ t("views.admin.PostEditor.settingsPanel.title") }}
      </span>
    </h2>

    <!-- 设置内容区域 -->
    <div class="flex-1 flex flex-col gap-6 p-4 overflow-y-auto">
      <!-- 文章标签 -->
      <PostEditorTagSetting v-model="tags" />

      <!-- 永久连接：CRUD 连接到文章的 URL Slug -->
      <PostEditorSlugSetting v-model="slug" required />

      <!-- 文章状态：草稿 / 已发布 / 归档等 -->
      <PostEditorStatusSetting v-model="status" />
    </div>
  </div>
</template>
