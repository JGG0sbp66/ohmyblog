<script setup lang="ts">
/**
 * 灵感速记卡片 — 快速创建草稿文章
 */
import { ref } from "vue";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { createPost, savePost } from "@/api/post.api";
import SettingCard from "@/components/base/card/SettingCard.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import TipTextarea from "@/components/common/input/TipTextarea.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";

const { t } = useLang();
const emit = defineEmits(["saved"]);

const title = ref("");
const content = ref("");
const isSaving = ref(false);

/**
 * 将纯文本包装为最简单的 ProseMirror JSON 文档结构，
 * 使 Tiptap 编辑器加载时能正常渲染段落。
 */
const buildProseMirrorDoc = (text: string) => ({
  type: "doc",
  content: text.split("\n").map((line) => ({
    type: "paragraph",
    content: line ? [{ type: "text", text: line }] : [],
  })),
});

const handleSave = async () => {
  if (isSaving.value) return;

  isSaving.value = true;
  try {
    const result = await createPost();
    const uuid = result?.post?.uuid;
    if (!uuid) throw new Error("Error");

    const plainText = content.value.trim();

    await savePost(uuid, {
      title: title.value.trim() || undefined,
      content: buildProseMirrorDoc(plainText),
      contentMarkdown: plainText || undefined,
      contentText: plainText || undefined,
    });

    useToast.success(t("api.success.保存成功"));
    title.value = "";
    content.value = "";
    emit("saved");
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <SettingCard
    :title="t('views.admin.Dashboard.quickNote.title')"
    :description="t('views.admin.Dashboard.quickNote.description')"
  >
    <div class="flex flex-col gap-3">
      <TipInput
        v-model="title"
        :label="t('views.admin.Dashboard.quickNote.titleLabel')"
        :hint="t('views.admin.Dashboard.quickNote.titleHint')"
        :placeholder="t('views.admin.Dashboard.quickNote.titlePlaceholder')"
      />

      <TipTextarea
        v-model="content"
        :label="t('views.admin.Dashboard.quickNote.contentLabel')"
        :placeholder="t('views.admin.Dashboard.quickNote.contentPlaceholder')"
      />
    </div>

    <template #footer>
      <div class="flex justify-end pt-4">
        <ButtonPrimary
          :text="t('views.admin.Dashboard.quickNote.save')"
          :loading="isSaving"
          @click="handleSave"
        />
      </div>
    </template>
  </SettingCard>
</template>
