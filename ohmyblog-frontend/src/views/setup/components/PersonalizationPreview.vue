<!-- src/views/setup/components/PersonalizationPreview.vue -->
<script setup lang="ts">
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import { useImageUpload } from "@/composables/upload.hook";
import { uploadAvatar, uploadHero } from "@/api/upload.api";

import ImageUpload from "@/components/base/upload/ImageUpload.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import Check from "@/components/icon/Check.vue";
import User from "@/components/icon/User.vue";
import PanelTop from "@/components/icon/PanelTop.vue";

const { t } = useLang();
const systemStore = useSystemStore();

/**
 * 上传配置映射
 */
const UPLOAD_CONFIGS = {
  avatar: {
    api: uploadAvatar,
    storeKey: "avatar",
    fileName: "avatar",
    msg: "views.setup.steps.step4.avatar.success",
  },
  hero: {
    api: uploadHero,
    storeKey: "hero",
    fileName: "hero",
    msg: "views.setup.steps.step4.hero.success",
  },
} as const;

// 1. 实例化上传管理的 Hook
const avatar = useImageUpload();
const hero = useImageUpload();

// 2. 提取变量供模板直接使用
const avatarLoading = avatar.loading;
const heroLoading = hero.loading;
const avatarUploadRef = avatar.uploadRef;
const heroUploadRef = hero.uploadRef;

/**
 * 统一处理图片上传逻辑
 */
const onFileChange = (type: keyof typeof UPLOAD_CONFIGS, file: File) => {
  const config = UPLOAD_CONFIGS[type];
  const hook = type === "avatar" ? avatar : hero;

  hook.handleUpload(
    file,
    config.api,
    () => {
      // 动态更新 store 对应项
      const info = systemStore.personalInfo as any;
      info[config.storeKey] =
        `/api/uploads/system/${config.fileName}.webp?t=${Date.now()}`;
    },
    config.msg,
  );
};
</script>

<template>
  <div class="w-full max-w-2xl mx-auto space-y-8 py-4">
    <!-- 1. 头像上传部分 -->
    <div
      class="flex flex-col md:flex-row items-center md:items-start gap-10 px-4 md:px-0"
    >
      <!-- 左侧：头像预览框 -->
      <div class="shrink-0">
        <ImageUpload
          ref="avatarUploadRef"
          v-model="systemStore.personalInfo.avatar"
          :loading="avatarLoading"
          width="w-32"
          height="h-32"
          rounded-class="rounded-2xl"
          accept="image/png,image/jpeg,image/webp"
          @change="(file) => onFileChange('avatar', file)"
        >
          <template #icon>
            <User size-class="w-12 h-12 text-text-icon/30" />
          </template>
        </ImageUpload>
      </div>

      <!-- 右侧：文字与操作 -->
      <div class="flex-1 flex flex-col gap-5 text-center md:text-left">
        <!-- 1. 标题与描述 -->
        <div class="space-y-1.5 pt-1">
          <h3 class="text-lg font-bold text-text-main">
            {{ t("views.setup.steps.step4.avatar.label") }}
          </h3>
          <p class="text-xs text-text-secondary leading-relaxed">
            {{ t("views.setup.steps.step4.avatar.description") }}
          </p>
        </div>

        <!-- 2. 按钮与状态 -->
        <div class="flex flex-col md:flex-row items-center gap-4">
          <ButtonPrimary
            :loading="avatarLoading"
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
            v-if="systemStore.personalInfo.avatar && !avatarLoading"
            type="success"
          >
            <template #icon>
              <Check size-class="w-3 h-3" />
            </template>
            {{ t("views.setup.steps.step4.avatar.success") }}
          </BaseTag>
        </div>

        <!-- 3. 辅助说明 -->
        <p class="text-[11px] text-text-icon/80 font-medium">
          {{ t("views.setup.steps.step4.avatar.help") }}
        </p>
      </div>
    </div>

    <!-- 2. 横幅上传部分 -->
    <div class="space-y-6 px-4 md:px-0">
      <!-- 第一行：标题和按钮 -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div class="space-y-1 text-center md:text-left">
          <h3 class="text-lg font-bold text-text-main">
            {{ t("views.setup.steps.step4.hero.label") }}
          </h3>
          <p class="text-xs text-text-secondary">
            {{ t("views.setup.steps.step4.hero.description") }}
          </p>
        </div>
        <ButtonPrimary
          :loading="heroLoading"
          class="text-sm"
          :text="
            hero.getButtonText(
              'views.setup.steps.step4.hero',
              systemStore.personalInfo.hero,
            )
          "
          @click="hero.trigger"
        />
      </div>

      <!-- 第二行：预览框 -->
      <div class="relative group">
        <ImageUpload
          ref="heroUploadRef"
          v-model="systemStore.personalInfo.hero"
          :loading="heroLoading"
          width="w-full"
          height="h-48 md:h-56"
          rounded-class="rounded-2xl"
          accept="image/png,image/jpeg,image/webp"
          @change="(file) => onFileChange('hero', file)"
        >
          <template #icon>
            <div class="flex flex-col items-center gap-3">
              <PanelTop size-class="w-10 h-10 text-text-icon/30" />
              <p class="text-xs text-text-icon/60">
                {{ t("views.setup.steps.step4.hero.recommend") }}
              </p>
            </div>
          </template>
        </ImageUpload>
      </div>

      <!-- 第三行：格式说明与状态 -->
      <div class="flex items-center justify-between min-h-6">
        <p class="text-[11px] text-text-icon/80 font-medium text-left">
          {{ t("views.setup.steps.step4.hero.format") }}
        </p>

        <BaseTag
          v-if="systemStore.personalInfo.hero && !heroLoading"
          type="success"
        >
          <template #icon>
            <Check size-class="w-3 h-3" />
          </template>
          {{ t("views.setup.steps.step4.hero.success") }}
        </BaseTag>
      </div>
    </div>
  </div>
</template>
