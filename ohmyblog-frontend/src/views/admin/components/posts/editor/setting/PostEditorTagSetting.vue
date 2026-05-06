<!-- src/views/admin/components/posts/editor/setting/PostEditorTagSetting.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { RiPriceTag2Line } from "@remixicon/vue";
import TagItem from "@/components/base/tag/TagItem.vue";
import PostEditorSettingItem from "@/views/admin/components/posts/editor/setting/PostEditorSettingItem.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

/** 当前已选标签列表（v-model 绑定到父级） */
const tags = defineModel<string[]>({ default: () => [] });
/** 输入框临时内容 */
const tagInput = ref("");

/** 将 tagInput 加入标签列表（去重、去空格） */
const addTag = () => {
  const value = tagInput.value.trim();
  if (value && !tags.value.includes(value)) {
    tags.value.push(value);
  }
  tagInput.value = "";
};

/** 按索引移除已选标签 */
const removeTag = (index: number) => {
  tags.value.splice(index, 1);
};
</script>

<template>
  <PostEditorSettingItem
    :label="t('views.admin.PostEditor.settingsPanel.tags.label')"
    :tooltip="t('views.admin.PostEditor.settingsPanel.tags.tooltip')"
  >
    <template #icon>
      <RiPriceTag2Line class="w-4 h-4 text-fg-subtle" />
    </template>

    <div class="flex flex-col gap-2">
      <!-- 已选标签预览：有标签时渲染，无标签时不占位 -->
      <div v-if="tags.length > 0" class="flex flex-wrap gap-1.5">
        <TagItem
          v-for="(tag, i) in tags"
          :key="tag"
          :label="tag"
          @remove="removeTag(i)"
        />
      </div>
      <!-- 标签输入框：按 Enter 添加，自动去重 -->
      <div
        class="w-full bg-bg-muted px-3 rounded-xl flex items-center focus-within:ring-2 focus-within:ring-accent/30"
      >
        <input
          v-model="tagInput"
          :placeholder="t('views.admin.PostEditor.settingsPanel.tags.placeholder')"
          class="w-full bg-transparent outline-none placeholder:text-fg-soft text-sm font-medium py-2.5"
          @keydown.enter.prevent="addTag"
        />
      </div>
    </div>
  </PostEditorSettingItem>
</template>
