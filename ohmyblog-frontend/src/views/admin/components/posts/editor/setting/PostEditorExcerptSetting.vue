<!-- src/views/admin/components/posts/editor/setting/PostEditorExcerptSetting.vue -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RiFileTextLine } from "@remixicon/vue";
import PostEditorSettingItem from "./PostEditorSettingItem.vue";
import BaseInputWrapper from "@/components/base/input/BaseInputWrapper.vue";
import { useLang } from "@/composables/lang.hook";
import { useValidator } from "@/composables/validator.hook";
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
const { validate } = useValidator();

const excerptSchema = SavePostDTO.properties.excerpt;
const MAX_LENGTH = excerptSchema?.maxLength as number;

const excerpt = defineModel<string>({ default: "" });
const error = ref("");

const remaining = computed(() => MAX_LENGTH - (excerpt.value?.length ?? 0));

watch(excerpt, (val) => {
  const result = validate(val, { schema: excerptSchema });
  error.value = result.error;
});
</script>

<template>
  <PostEditorSettingItem
    :label="t('views.admin.PostEditor.settingsPanel.excerpt.label')"
    :tooltip="t('views.admin.PostEditor.settingsPanel.excerpt.tooltip')"
  >
    <template #icon>
      <RiFileTextLine class="w-4 h-4 text-fg-subtle" />
    </template>

    <BaseInputWrapper :error="error || undefined">
      <textarea
        v-model="excerpt"
        rows="4"
        :placeholder="t('views.admin.PostEditor.settingsPanel.excerpt.placeholder')"
        class="w-full min-h-10 bg-transparent px-4 py-2.5 outline-none placeholder:text-fg-soft text-sm font-medium
               resize-none leading-relaxed"
      />
    </BaseInputWrapper>

    <!-- 字数计数器 -->
    <p class="mt-1 text-right text-[10px]" :class="error ? 'text-red-500' : 'text-fg-subtle/50'">
      {{ remaining }} / {{ MAX_LENGTH }}
    </p>
  </PostEditorSettingItem>
</template>
