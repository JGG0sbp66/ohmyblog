<!-- src/views/main/components/hero/HeroImageEditor.vue -->
<script setup lang="ts">
import { ref } from "vue";
import ExpandButton from "@/components/common/button/ExpandButton.vue";
import Picture from "@/components/icon/common/Picture.vue";
import ImageUpload from "@/components/base/upload/ImageUpload.vue";
import { useImageUpload } from "@/composables/upload.hook";
import { uploadHero } from "@/api/upload.api";
import { useSystemStore } from "@/stores/system.store";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();
const systemStore = useSystemStore();

const {
  loading: uploading,
  uploadRef: imageUploadRef,
  handleUpload,
} = useImageUpload();

/**
 * 触发文件选择
 */
const triggerUpload = () => {
  imageUploadRef.value?.triggerClick();
};

/**
 * 处理文件选择
 */
const handleFileChange = (file: File) => {
  handleUpload(file, uploadHero, (url) => {
    systemStore.personalInfo.hero = url;
  });
};
</script>

<template>
  <!-- 隐藏的 ImageUpload 组件 -->
  <ImageUpload
    ref="imageUploadRef"
    v-model="systemStore.personalInfo.hero"
    :loading="uploading"
    accept="image/png,image/jpeg,image/webp"
    class="hidden"
    @change="handleFileChange"
  />

  <!-- 悬浮按钮 -->
  <button
    type="button"
    @click="triggerUpload"
    :disabled="uploading"
    class="absolute bottom-6 right-6 z-10"
    :aria-label="t('views.setup.steps.step4.hero.change')"
  >
    <ExpandButton :text="t('views.setup.steps.step4.hero.change')">
      <template #icon-start>
        <Picture />
      </template>
    </ExpandButton>
  </button>
</template>
