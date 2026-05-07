<!-- src/views/admin/components/posts/editor/setting/PostEditorCoverSetting.vue -->
<script setup lang="ts">
import { RiImageFill } from "@remixicon/vue";
import PostEditorSettingItem from "./PostEditorSettingItem.vue";
import ImageUpload from "@/components/base/upload/ImageUpload.vue";
import { useLang } from "@/composables/lang.hook";
import { useImageUpload } from "@/composables/upload.hook";
import { useToast } from "@/composables/toast.hook";
import { uploadPostCover } from "@/api/upload.api";
import { savePost } from "@/api/post.api";

/**
 * PostEditorCoverSetting — 文章封面图设置块
 *
 * 流程：选择文件 → uploadPostCover 上传 → 获取 URL → 更新 v-model → savePost 持久化
 *
 * Props:
 * - uuid: 当前文章的 UUID（用于上传和保存接口）
 *
 * v-model: 封面图 URL（string | null）
 */
const { t } = useLang();

const props = defineProps<{
  uuid: string;
}>();

const coverImage = defineModel<string | null>({ default: null });

const cover = useImageUpload();
const coverLoading = cover.loading;
const coverUploadRef = cover.uploadRef;

const onFileChange = (file: File) => {
  cover.handleUpload(
    file,
    (f) => uploadPostCover(props.uuid, { cover: f }),
    (url) => {
      coverImage.value = url;
      savePost(props.uuid, { coverImage: url }).catch((e: unknown) => {
        const msg = typeof e === "string" ? e : (e as any)?.message || "Error";
        useToast.error(t(`api.errors.${msg}`));
      });
    },
  );
};
</script>

<template>
  <PostEditorSettingItem
    :label="t('views.admin.PostEditor.settingsPanel.coverImage.label')"
    :tooltip="t('views.admin.PostEditor.settingsPanel.coverImage.tooltip')"
  >
    <template #icon>
      <RiImageFill class="w-4 h-4 text-fg-subtle" />
    </template>

    <ImageUpload
      ref="coverUploadRef"
      v-model="coverImage"
      :loading="coverLoading"
      width="w-full"
      height="h-32"
      rounded-class="rounded-xl"
      @change="onFileChange"
    >
      <template #icon>
        <div class="flex flex-col items-center gap-2">
          <RiImageFill class="w-8 h-8 text-fg-subtle/30" />
          <p class="text-[10px] text-fg-subtle/50 text-center leading-tight">
            {{ t("views.admin.PostEditor.settingsPanel.coverImage.hint") }}
          </p>
        </div>
      </template>
    </ImageUpload>
  </PostEditorSettingItem>
</template>
