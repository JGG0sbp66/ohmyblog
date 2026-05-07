<!-- src/views/admin/components/posts/editor/setting/PostEditorStatusSetting.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { RiFileList3Line } from "@remixicon/vue";
import PostEditorSettingItem from "./PostEditorSettingItem.vue";
import SegmentedControl from "@/components/base/control/SegmentedControl.vue";
import { useLang } from "@/composables/lang.hook";
import type { TPostStatus } from "@server/db/constants/post.constants";
import { POST_STATUS_LABEL_KEYS } from "@/views/admin/components/posts/table/cells/PostStatusBadge.vue";

/**
 * PostEditorStatusSetting — 文章状态设置块
 *
 * 复用 SegmentedControl + POST_STATUS_LABEL_KEYS，与文章列表保持一致的文案。
 * 仅提供 draft / published / archived 三个选项，deleted 状态由删除操作处理。
 *
 * v-model: TPostStatus
 */
const { t } = useLang();

const status = defineModel<TPostStatus>({ default: "draft" });

/** 编辑器中可选的状态（排除 deleted，删除走独立操作） */
const statusOptions = computed(() =>
  (["draft", "published", "archived"] as TPostStatus[]).map((s) => ({
    value: s,
    label: t(POST_STATUS_LABEL_KEYS[s]),
  })),
);
</script>

<template>
  <PostEditorSettingItem
    :label="t('views.admin.PostEditor.settingsPanel.status.label')"
    :tooltip="t('views.admin.PostEditor.settingsPanel.status.tooltip')"
  >
    <template #icon>
      <RiFileList3Line class="w-4 h-4 text-fg-subtle" />
    </template>

    <SegmentedControl v-model="status" :options="statusOptions" />
  </PostEditorSettingItem>
</template>
