<!-- src/views/admin/components/posts/editor/setting/PostEditorSlugSetting.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { RiLinksLine } from "@remixicon/vue";
import PostEditorSettingItem from "./PostEditorSettingItem.vue";
import UrlPrefixInput from "@/components/common/input/UrlPrefixInput.vue";
import { useLang } from "@/composables/lang.hook";
import { useValidator } from "@/composables/validator.hook";
import { SavePostDTO } from "@server/dtos/post.dto";

/**
 * PostEditorSlugSetting — 文章 URL Slug 设置块
 *
 * 布局：[/posts/ 前缀区] [slug 输入框]
 * 格式非法时在输入框下方显示错误提示（通过 UrlPrefixInput 的 error prop）
 *
 * Props:
 * - prefix: URL 前缀，默认 "/posts/"（可由父级传入实际域名路径）
 * - required: 是否必填：空値时显示必填错误 + 标题红色星号
 *
 * v-model: slug 字符串值
 */
const { t } = useLang();
const { validate: runValidator } = useValidator();

const slug = defineModel<string>({ default: "" });
/** 用户首次离开输入框后才激活校验（同 TipInput 的 blur-first 模式） */
const touched = ref(false);
const handleBlur = () => {
  touched.value = true;
};

const props = withDefaults(
  defineProps<{
    /** URL 前缀，例如 "yoursite.com/posts/" */
    prefix?: string;
    /** 是否必填：空値时显示必填错误 + 标题红色星号 */
    required?: boolean;
  }>(),
  { prefix: "/posts/" },
);

/** slug 校验：blur 后才激活，依次进行必填和格式检查（格式规则直接源自后端 SavePostDTO.slug） */
const slugError = computed(() => {
  if (!touched.value) return "";

  const { isValid, error } = runValidator(slug.value, {
    required: props.required,
    schema: SavePostDTO.properties.slug,
  });
  return isValid ? "" : error;
});
</script>

<template>
  <PostEditorSettingItem
    :label="t('views.admin.PostEditor.settingsPanel.slug.label')"
    :tooltip="t('views.admin.PostEditor.settingsPanel.slug.tooltip')"
    :required="required"
  >
    <template #icon>
      <RiLinksLine class="w-4 h-4 text-fg-subtle" />
    </template>

    <UrlPrefixInput
      v-model="slug"
      :prefix="prefix"
      :placeholder="t('views.admin.PostEditor.settingsPanel.slug.placeholder')"
      :error="slugError"
      @blur="handleBlur"
    />
  </PostEditorSettingItem>
</template>
