<!-- src/views/admin/components/posts/editor/PostEditorSettingsPanel.vue -->
<script setup lang="ts">
import { X } from "lucide-vue-next";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import PostEditorTagSetting from "@/views/admin/components/posts/editor/setting/PostEditorTagSetting.vue";
import PostEditorSlugSetting from "@/views/admin/components/posts/editor/setting/PostEditorSlugSetting.vue";
import PostEditorStatusSetting from "@/views/admin/components/posts/editor/setting/PostEditorStatusSetting.vue";
import PostEditorCoverSetting from "@/views/admin/components/posts/editor/setting/PostEditorCoverSetting.vue";
import PostEditorExcerptSetting from "@/views/admin/components/posts/editor/setting/PostEditorExcerptSetting.vue";
import PostEditorPropertySetting from "@/views/admin/components/posts/editor/setting/PostEditorPropertySetting.vue";
import { useLang } from "@/composables/lang.hook";
import type { TPostStatus } from "@server/db/constants/post.constants";

const { t } = useLang();

const props = defineProps<{
  uuid: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const slug = defineModel<string>("slug", { default: "" });
const tags = defineModel<string[]>("tags", { default: () => [] });
const status = defineModel<TPostStatus>("status", { default: "draft" });
const excerpt = defineModel<string>("excerpt", { default: "" });
const coverImage = defineModel<string | null>("coverImage", { default: null });
const pinned = defineModel<boolean>("pinned", { default: false });
</script>

<template>
  <div
    class="flex h-full w-full shrink-0 flex-col border-l border-border/40 bg-bg-card md:w-72"
  >
    <!-- 面板标题 -->
    <h2
      class="flex shrink-0 items-center justify-between border-b border-border/40 px-5 pt-4 pb-3"
    >
      <!-- h-9 与工具栏按钮等高，确保在任意 DPR 下两侧行高精确对齐 -->
      <span class="inline-flex h-9 items-center text-lg font-bold text-fg">
        {{ t("views.admin.PostEditor.settingsPanel.title") }}
      </span>
      <ButtonSecondary
        class="h-9 w-9 md:hidden"
        :aria-label="t('views.admin.PostEditor.settingsPanel.close')"
        @click="emit('close')"
      >
        <X class="h-5 w-5" />
      </ButtonSecondary>
    </h2>

    <!-- 设置内容区域 -->
    <div class="flex-1 flex flex-col gap-6 p-4 overflow-y-auto">
      <!-- 文章标签 -->
      <PostEditorTagSetting v-model="tags" />

      <!-- 永久连接：CRUD 连接到文章的 URL Slug -->
      <PostEditorSlugSetting v-model="slug" required />

      <!-- 文章状态：草稿 / 已发布 / 归档等 -->
      <PostEditorStatusSetting v-model="status" />

      <!-- 文章摘要 -->
      <PostEditorExcerptSetting v-model="excerpt" />

      <!-- 封面图上传 -->
      <PostEditorCoverSetting v-model="coverImage" :uuid="props.uuid" />

      <!-- 文章属性：置顶等布尔开关 -->
      <PostEditorPropertySetting v-model:pinned="pinned" />
    </div>
  </div>
</template>
