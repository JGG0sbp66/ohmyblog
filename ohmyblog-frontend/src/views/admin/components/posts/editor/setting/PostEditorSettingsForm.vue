<script setup lang="ts">
import PostEditorTagSetting from "@/views/admin/components/posts/editor/setting/PostEditorTagSetting.vue";
import PostEditorSlugSetting from "@/views/admin/components/posts/editor/setting/PostEditorSlugSetting.vue";
import PostEditorStatusSetting from "@/views/admin/components/posts/editor/setting/PostEditorStatusSetting.vue";
import PostEditorCoverSetting from "@/views/admin/components/posts/editor/setting/PostEditorCoverSetting.vue";
import PostEditorExcerptSetting from "@/views/admin/components/posts/editor/setting/PostEditorExcerptSetting.vue";
import PostEditorPropertySetting from "@/views/admin/components/posts/editor/setting/PostEditorPropertySetting.vue";
import type { TPostStatus } from "@server/db/constants/post.constants";

/**
 * 文章设置字段的唯一实现。
 * 桌面侧栏和移动端 BaseSheet 只提供不同容器，共用这里的表单状态与字段顺序。
 */
const props = defineProps<{
  uuid: string;
}>();

const slug = defineModel<string>("slug", { default: "" });
const tags = defineModel<string[]>("tags", { default: () => [] });
const status = defineModel<TPostStatus>("status", { default: "draft" });
const excerpt = defineModel<string>("excerpt", { default: "" });
const coverImage = defineModel<string | null>("coverImage", { default: null });
const coverEnabled = defineModel<boolean>("coverEnabled", { default: true });
const pinned = defineModel<boolean>("pinned", { default: false });
</script>

<template>
  <div class="flex flex-col gap-6">
    <PostEditorTagSetting v-model="tags" />
    <PostEditorSlugSetting v-model="slug" required />
    <PostEditorStatusSetting v-model="status" />
    <PostEditorExcerptSetting v-model="excerpt" />
    <PostEditorCoverSetting
      v-model="coverImage"
      v-model:cover-enabled="coverEnabled"
      :uuid="props.uuid"
    />
    <PostEditorPropertySetting
      v-model:pinned="pinned"
      v-model:cover-image="coverImage"
      v-model:cover-enabled="coverEnabled"
    />
  </div>
</template>
