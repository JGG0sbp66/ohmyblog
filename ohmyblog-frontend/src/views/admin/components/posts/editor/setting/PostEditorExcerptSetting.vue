<!-- src/views/admin/components/posts/editor/setting/PostEditorExcerptSetting.vue -->
<script setup lang="ts">
import { RiFileTextLine } from "@remixicon/vue";
import PostEditorSettingItem from "./PostEditorSettingItem.vue";
import { useLang } from "@/composables/lang.hook";
import TipTextarea from "@/components/common/input/TipTextarea.vue";
import { SavePostDTO } from "@server/dtos/post.dto";

/**
 * PostEditorExcerptSetting — 文章摘要设置块
 *
 * 手动摘要，最多 N 字（由后端 SavePostDTO.excerpt.maxLength 决定）；
 * 未填时前台自动取 contentText 前 N 字。
 *
 * v-model: string
 */
const { t } = useLang();

// 复用后端 DTO 的字段 schema：
// - maxLength 用于字数计数器
// - 统一校验规则（与后端保持一致）
const excerptSchema = SavePostDTO.properties.excerpt;

const excerpt = defineModel<string>({ default: "" });
</script>

<template>
  <PostEditorSettingItem
    :label="t('views.admin.PostEditor.settingsPanel.excerpt.label')"
    :tooltip="t('views.admin.PostEditor.settingsPanel.excerpt.tooltip')"
  >
    <template #icon>
      <RiFileTextLine class="w-4 h-4 text-fg-subtle" />
    </template>

    <!-- TipTextarea 内部会基于 schema 做校验，并展示 maxLength 字数计数器 -->

    <TipTextarea
      v-model="excerpt"
      :placeholder="
        t('views.admin.PostEditor.settingsPanel.excerpt.placeholder')
      "
      :schema="excerptSchema"
    />
  </PostEditorSettingItem>
</template>
