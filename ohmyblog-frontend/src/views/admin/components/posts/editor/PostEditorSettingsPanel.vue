<script setup lang="ts">
import PostEditorSettingsForm from "@/views/admin/components/posts/editor/setting/PostEditorSettingsForm.vue";
import { useLang } from "@/composables/lang.hook";
import type { TPostStatus } from "@server/db/constants/post.constants";

const { t } = useLang();

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
  <div
    class="flex h-full w-full shrink-0 flex-col border-l border-border/40 bg-bg-card md:w-72"
  >
    <!-- 桌面侧栏标题；移动端标题由 BaseSheet 统一提供。 -->
    <h2
      class="flex shrink-0 items-center border-b border-border/40 px-5 pt-4 pb-3"
    >
      <span class="inline-flex h-9 items-center text-lg font-bold text-fg">
        {{ t("views.admin.PostEditor.settingsPanel.title") }}
      </span>
    </h2>

    <div class="flex-1 overflow-y-auto p-4">
      <PostEditorSettingsForm
        :uuid="props.uuid"
        v-model:slug="slug"
        v-model:tags="tags"
        v-model:status="status"
        v-model:excerpt="excerpt"
        v-model:cover-image="coverImage"
        v-model:cover-enabled="coverEnabled"
        v-model:pinned="pinned"
      />
    </div>
  </div>
</template>
