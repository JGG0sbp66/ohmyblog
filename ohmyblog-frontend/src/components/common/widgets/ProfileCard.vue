<!-- src/components/common/widgets/ProfileCard.vue -->
<script setup lang="ts">
import { useSystemStore } from "@/stores/system.store";
import { useAuthStore } from "@/stores/auth.store";
import { useTheme } from "@/composables/theme.hook";
import { useImageUpload } from "@/composables/upload.hook";
import { uploadAvatar } from "@/api/upload.api";
import { upsertConfig } from "@/api/config.api";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import User from "@/components/icon/common/User.vue";
import Loading from "@/components/icon/common/Loading.vue";
import BaseCard from "@/components/base/card/BaseCard.vue";
import ImageUpload from "@/components/base/upload/ImageUpload.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";

const systemStore = useSystemStore();
const authStore = useAuthStore();
const { isDark } = useTheme();
const { t } = useLang();

const {
  loading: uploading,
  uploadRef: imageUploadRef,
  handleUpload,
} = useImageUpload();

/**
 * 触发头像上传选择
 */
const triggerUpload = () => {
  if (!authStore.isAdmin || uploading.value) return;
  imageUploadRef.value?.triggerClick();
};

/**
 * 处理头像文件选择
 */
const handleFileChange = (file: File) => {
  handleUpload(file, uploadAvatar, async (url) => {
    // 1. 更新全局 store 中的头像链接
    systemStore.personalInfo.avatar = url;

    // 2. 同步到后端配置
    try {
      await upsertConfig({
        configKey: "personal_info",
        configValue: systemStore.personalInfo,
      } as any);
    } catch (error) {
      useToast.error(t("api.errors.获取个性化配置失败"));
    }
  });
};
</script>

<template>
  <!-- 隐藏的上传组件 -->
  <ImageUpload
    ref="imageUploadRef"
    v-model="systemStore.personalInfo.avatar"
    :loading="uploading"
    class="hidden"
    @change="handleFileChange"
  />

  <BaseCard
    padding="none"
    class="w-70 flex flex-col items-center text-center p-3 rounded-2xl!"
  >
    <!-- 头像区域 -->
    <div class="mb-5">
      <!-- 主头像图片 -->
      <div
        class="group relative w-64 h-64 rounded-xl overflow-hidden bg-bg-muted shadow-inner"
        :class="{ 'cursor-pointer': authStore.isAdmin && !uploading }"
        @click="triggerUpload"
      >
        <img
          v-if="systemStore.personalInfo.avatar"
          :src="systemStore.personalInfo.avatar"
          :alt="systemStore.personalInfo.username"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <User sizeClass="w-16 h-16 text-fg-soft" />
        </div>

        <!-- 管理员悬浮遮罩 -->
        <div
          v-if="authStore.isAdmin"
          class="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <div
            class="transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-spring"
          >
            <Loading v-if="uploading" sizeClass="w-12 h-12 text-white" />
            <User v-else sizeClass="w-12 h-12 text-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- 信息区域 -->
    <div class="space-y-2">
      <h2
        v-if="systemStore.personalInfo.username"
        class="text-2xl font-black text-fg tracking-tight"
      >
        {{ systemStore.personalInfo.username }}
      </h2>
      <div
        v-if="systemStore.personalInfo.username"
        class="w-8 h-1 bg-accent/80 mx-auto rounded-full"
      ></div>
      <p
        v-if="systemStore.personalInfo.bio"
        class="text-sm text-fg-muted font-medium line-clamp-3 leading-relaxed px-2"
      >
        {{ systemStore.personalInfo.bio }}
      </p>
    </div>

    <!-- 社交链接区域 -->
    <div
      v-if="systemStore.personalInfo.socialLinks.length > 0"
      class="flex flex-wrap justify-center gap-3 mt-2"
    >
      <a
        v-for="link in systemStore.personalInfo.socialLinks"
        :key="link.name"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        :title="link.name"
      >
        <div class="w-11 h-11 bg-bg-muted rounded-lg">
          <ButtonSecondary class="w-full h-full p-0! hover:before:bg-accent/20!">
            <!-- 根据当前主题自动切换图标 -->
            <img
              v-if="isDark ? (link.iconDark || link.iconLight) : link.iconLight"
              :src="(isDark ? (link.iconDark || link.iconLight) : link.iconLight)!"
              :alt="link.name"
              class="w-6 h-6 object-contain"
            />
            <span v-else class="text-xs font-bold">{{
              link.name.slice(0, 1).toUpperCase()
            }}</span>
          </ButtonSecondary>
        </div>
      </a>
    </div>
  </BaseCard>
</template>

<style scoped>
.ease-spring {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
