<!-- src/views/admin/components/posts/editor/setting/PostEditorCoverSetting.vue -->
<script setup lang="ts">
import { RiImageFill } from "@remixicon/vue";
import PostEditorSettingItem from "./PostEditorSettingItem.vue";
import ImageUpload from "@/components/base/upload/ImageUpload.vue";
import { useLang } from "@/composables/lang.hook";
import { useImageUpload } from "@/composables/upload.hook";
import { UPLOAD_LIMITS } from "@/api/shared";
import { uploadPostCover } from "@/api/upload.api";

/**
 * PostEditorCoverSetting — 文章封面图设置块
 *
 * 流程：选择文件 → uploadPostCover 上传 → 获取 URL → 更新 v-model。
 * 持久化不在这里做：usePostEditor 里 watch(coverImage) 会标脏并立即触发
 * 走统一互斥的自动保存（并发安全、失败可重试，见 post-editor.hook.ts）。
 *
 * 上传新封面意味着想用封面：无论「显示封面」开关之前是什么状态都置回开，
 * coverEnabled 是普通 payload 字段，跟着后续保存一起落库。
 *
 * Props:
 * - uuid: 当前文章的 UUID（用于上传接口）
 *
 * v-model: 封面图 URL（string | null）
 * v-model: coverEnabled — 是否展示封面（上传成功时置回 true）
 */
const { t } = useLang();

const props = defineProps<{
  uuid: string;
}>();

const coverImage = defineModel<string | null>({ default: null });
const coverEnabled = defineModel<boolean>("coverEnabled", { default: true });

const cover = useImageUpload();
const coverLoading = cover.loading;
const coverUploadRef = cover.uploadRef;

const onFileChange = (file: File) => {
  cover.handleUpload(
    file,
    (f) => uploadPostCover(props.uuid, { cover: f }),
    (url) => {
      coverImage.value = url;
      coverEnabled.value = true;
    },
    UPLOAD_LIMITS.postCover,
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
