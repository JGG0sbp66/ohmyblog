<!-- src/views/setup/components/HeroUploadSetting.vue -->
<script setup lang="ts">
import { useLang } from "@/composables/lang.hook";
import { useImageUpload } from "@/composables/upload.hook";
import { uploadHero } from "@/api/upload.api";
import ImageUpload from "@/components/base/upload/ImageUpload.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import { RiGalleryFill } from "@remixicon/vue";

/**
 * Hero 图片上传配置组件
 * 封装了标题、描述、上传按钮、预览及格式说明
 */
const props = defineProps<{
  /** 绑定的图片 URL */
  modelValue?: string | null;
  /** 是否显示成功标签 (通常用于 setup 流程) */
  showSuccessTag?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", file: File): void;
}>();

const { t } = useLang();
const hero = useImageUpload();

const handleFileChange = (file: File) => {
  emit("change", file);
  hero.handleUpload(
    file,
    (f) => uploadHero({ hero: f }),
    (url) => {
      emit("update:modelValue", url);
    },
  );
};

// 暴露 trigger 给父组件，以便外部按钮（如果有）触发上传
defineExpose({
  trigger: hero.trigger,
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 第一行：标题和按钮 -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div class="flex flex-col gap-1 text-center md:text-left">
        <h3 class="text-lg font-bold text-fg">
          {{ t("views.setup.steps.step4.hero.label") }}
        </h3>
        <p class="text-xs text-fg-muted">
          {{ t("views.setup.steps.step4.hero.description") }}
        </p>
      </div>
      <ButtonPrimary
        :loading="hero.loading.value"
        class="text-sm"
        :text="hero.getButtonText('views.setup.steps.step4.hero', modelValue)"
        @click="hero.trigger"
      />
    </div>

    <!-- 第二行：预览框 -->
    <div class="relative group">
      <ImageUpload
        ref="heroUploadRef"
        :model-value="modelValue"
        :loading="hero.loading.value"
        width="w-full"
        height="h-48 md:h-56"
        rounded-class="rounded-2xl"
        @change="handleFileChange"
      >
        <template #icon>
          <div class="flex flex-col items-center gap-3">
            <RiGalleryFill class="w-10 h-10 text-fg-subtle/30" />
            <p class="text-xs text-fg-subtle/60">
              {{ t("views.setup.steps.step4.hero.recommend") }}
            </p>
          </div>
        </template>
      </ImageUpload>
    </div>

    <!-- 第三行：格式说明与状态 -->
    <div class="flex items-center justify-between min-h-6">
      <p class="text-[11px] text-fg-subtle/80 font-medium text-left">
        {{ t("views.setup.steps.step4.hero.format") }}
      </p>

      <BaseTag
        v-if="showSuccessTag && modelValue && !hero.loading.value"
        type="success"
      >
        {{ t("views.setup.steps.step4.hero.uploaded") }}
      </BaseTag>
    </div>
  </div>
</template>
