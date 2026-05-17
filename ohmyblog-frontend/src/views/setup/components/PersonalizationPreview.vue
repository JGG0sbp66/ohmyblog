<!-- src/views/setup/components/PersonalizationPreview.vue -->
<script setup lang="ts">
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import { useImageUpload } from "@/composables/upload.hook";
import { uploadAvatar } from "@/api/upload.api";

import ImageUpload from "@/components/base/upload/ImageUpload.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import HeroUploadSetting from "./HeroUploadSetting.vue";
import { RiIdCardLine } from "@remixicon/vue";

const { t } = useLang();
const systemStore = useSystemStore();

// 1. 实例化头像上传管理的 Hook
const avatar = useImageUpload();

/**
 * 处理头像上传逻辑
 */
const onAvatarChange = (file: File) => {
  avatar.handleUpload(
    file,
    (f) => uploadAvatar({ avatar: f }),
    (url) => {
      systemStore.personalInfo.avatar = url;
    },
  );
};
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-2xl mx-auto py-4">
    <!-- 1. 头像上传部分 -->
    <div
      class="flex flex-col md:flex-row items-center md:items-start gap-10 px-4 md:px-0"
    >
      <!-- 左侧：头像预览框 -->
      <div class="shrink-0">
        <ImageUpload
          ref="avatarUploadRef"
          v-model="systemStore.personalInfo.avatar"
          :loading="avatar.loading.value"
          width="w-32"
          height="h-32"
          rounded-class="rounded-2xl"
          @change="onAvatarChange"
        >
          <template #icon>
            <RiIdCardLine class="w-12 h-12 text-fg-subtle/30" />
          </template>
        </ImageUpload>
      </div>

      <!-- 右侧：文字与操作 -->
      <div class="flex-1 flex flex-col gap-5 text-center md:text-left">
        <!-- 1. 标题与描述 -->
        <div class="flex flex-col gap-1.5 pt-1">
          <h3 class="text-lg font-bold text-fg">
            {{ t("views.setup.steps.step4.avatar.label") }}
          </h3>
          <p class="text-xs text-fg-muted leading-relaxed">
            {{ t("views.setup.steps.step4.avatar.description") }}
          </p>
        </div>

        <!-- 2. 按钮与状态 -->
        <div class="flex flex-col md:flex-row items-center gap-4">
          <ButtonPrimary
            :loading="avatar.loading.value"
            class="text-sm"
            :text="
              avatar.getButtonText(
                'views.setup.steps.step4.avatar',
                systemStore.personalInfo.avatar,
              )
            "
            @click="avatar.trigger"
          />

          <BaseTag
            v-if="systemStore.personalInfo.avatar && !avatar.loading.value"
            type="success"
          >
            {{ t("views.setup.steps.step4.avatar.uploaded") }}
          </BaseTag>
        </div>

        <!-- 3. 辅助说明 -->
        <p class="text-xs text-fg-subtle/80 font-medium">
          {{ t("views.setup.steps.step4.avatar.help") }}
        </p>
      </div>
    </div>

    <!-- 2. 横幅上传部分 -->
    <HeroUploadSetting
      v-model="systemStore.personalInfo.hero"
      show-success-tag
      class="px-4 md:px-0"
    />
  </div>
</template>
