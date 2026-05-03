<!-- src/components/common/upload/FaviconUpload.vue -->
<script setup lang="ts">
import ImageUpload from "@/components/base/upload/ImageUpload.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import { useLang } from "@/composables/lang.hook";
import { useImageUpload } from "@/composables/upload.hook";
import { uploadFavicon } from "@/api/upload.api";

const { t } = useLang();

const modelValue = defineModel<string>({ default: "" });

const { loading, uploadRef, trigger, getButtonText, handleUpload } =
  useImageUpload();

const handleFileChange = (file: File) => {
  handleUpload(
    file,
    (f) => uploadFavicon({ icon: f }),
    (url) => {
      modelValue.value = url;
    },
  );
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-1.5 mb-2 px-1">
      <label
        class="text-sm font-bold text-fg-subtle uppercase tracking-wider select-none"
      >
        {{ t("views.setup.steps.step2.siteIcon.label") }}
      </label>
    </div>

    <div class="flex items-start gap-5">
      <!-- 预览区域 -->
      <div class="shrink-0">
        <ImageUpload
          ref="uploadRef"
          v-model="modelValue"
          :loading="loading"
          @change="handleFileChange"
        />
      </div>

      <!-- 按钮与说明 -->
      <div class="flex-1 pt-1">
        <div class="flex items-center gap-3">
          <ButtonPrimary
            type="button"
            class="text-sm"
            :loading="loading"
            :text="
              getButtonText('views.setup.steps.step2.siteIcon', modelValue)
            "
            @click="trigger"
          />
          <BaseTag v-if="modelValue" type="success">
            {{ t("views.setup.steps.step2.siteIcon.uploaded") }}
          </BaseTag>
        </div>

        <div class="mt-3 flex flex-col gap-1">
          <p class="text-[11px] text-fg-muted leading-relaxed">
            {{ t("views.setup.steps.step2.siteIcon.help1") }}
          </p>
          <p class="text-[11px] text-fg-muted leading-relaxed">
            {{ t("views.setup.steps.step2.siteIcon.help2") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
