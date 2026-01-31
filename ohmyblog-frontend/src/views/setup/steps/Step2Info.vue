<!-- src/views/setup/steps/Step2Info.vue -->
<script setup lang="ts">
import { ref } from "vue";
import TipInput from "@/components/common/input/TipInput.vue";
import StepLayout from "../components/StepLayout.vue";
import ImageUpload from "@/components/base/upload/ImageUpload.vue";
import { useLang } from "@/composables/lang.hook";
import { useSetupStep, type Validatable } from "@/composables/setup-step.hook";
import { upsertConfig } from "@/api/config.api";
import { uploadFavicon } from "@/api/upload.api";
import { useSystemStore } from "@/stores/system.store";
import { useToast } from "@/composables/toast.hook";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import Check from "@/components/icon/Check.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";

const { t } = useLang();
const { isSubmitting, runStep } = useSetupStep();
const systemStore = useSystemStore();

const titleInputRef = ref<Validatable | null>(null);
const imageUploadRef = ref<InstanceType<typeof ImageUpload> | null>(null);
const uploading = ref(false);

/**
 * 手动点击上传按钮时，触发 ImageUpload 组件内部的文件选择逻辑
 */
const handleIconClick = () => {
  imageUploadRef.value?.triggerClick();
};

/**
 * 处理 ImageUpload 组件抛出的文件，执行实际的上传 API 请求
 */
const handleFileChange = async (file: File) => {
  try {
    uploading.value = true;

    // 执行文件上传
    await uploadFavicon(file);

    // 上传成功后，更新本地预览路径（带上时间戳避缓存）
    // 同时也赋值给 store，让界面显示“已上传”状态
    systemStore.siteInfo.logo = `/api/uploads/system/favicon.png?t=${Date.now()}`;

    useToast.success(t("api.success.config.保存成功"));
  } catch (error) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    uploading.value = false;
  }
};

const handleNext = () =>
  runStep(
    () => {
      return upsertConfig({
        configKey: "site_info",
        configValue: systemStore.siteInfo,
      });
    },
    { validate: [titleInputRef.value] },
  );
</script>

<template>
  <StepLayout
    :title="t('views.setup.steps.step2.title')"
    :description="t('views.setup.steps.step2.description')"
    :loading="isSubmitting"
    @next="handleNext"
  >
    <!-- 站点名称 -->
    <TipInput
      ref="titleInputRef"
      v-model="systemStore.siteInfo.title"
      :label="t('views.setup.steps.step2.siteTitle.label')"
      :placeholder="t('views.setup.steps.step2.siteTitle.placeholder')"
      required
    />

    <!-- 页脚版权 -->
    <TipInput
      v-model="systemStore.siteInfo.footer"
      :label="t('views.setup.steps.step2.footer.label')"
      :placeholder="t('views.setup.steps.step2.footer.placeholder')"
      :hint="t('views.setup.steps.step2.footer.hint')"
    />

    <!-- 备案号 -->
    <TipInput
      v-model="systemStore.siteInfo.icp"
      :label="t('views.setup.steps.step2.icp.label')"
      :placeholder="t('views.setup.steps.step2.icp.placeholder')"
      :hint="t('views.setup.steps.step2.icp.hint')"
    />

    <!-- 站点图标上传 -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-text-main pb-1">
        {{ t("views.setup.steps.step2.siteIcon.label") }}
      </label>
      <div class="flex items-start gap-5">
        <!-- 预览区域 -->
        <div class="shrink-0">
          <ImageUpload
            ref="imageUploadRef"
            v-model="systemStore.siteInfo.logo"
            :loading="uploading"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif,image/apng,image/avif,image/x-icon,image/vnd.microsoft.icon,.ico"
            @change="handleFileChange"
          />
        </div>

        <!-- 按钮与说明 -->
        <div class="flex-1 pt-1">
          <div class="flex items-center gap-3">
            <ButtonPrimary
              type="button"
              class="w-auto! h-auto! px-4 py-1.5 text-sm"
              @click="handleIconClick"
              :disabled="uploading"
              :text="
                uploading
                  ? t('views.setup.steps.step2.siteIcon.uploading')
                  : systemStore.siteInfo.logo
                    ? t('views.setup.steps.step2.siteIcon.change')
                    : t('views.setup.steps.step2.siteIcon.upload')
              "
            />

            <BaseTag
              v-if="systemStore.siteInfo.logo"
              type="success"
            >
              <template #icon>
                <Check size-class="w-3 h-3" />
              </template>
              {{ t("views.setup.steps.step2.siteIcon.success") }}
            </BaseTag>
          </div>

          <div class="mt-3 space-y-1">
            <p class="text-[11px] text-text-icon leading-relaxed">
              {{ t("views.setup.steps.step2.siteIcon.help1") }}
            </p>
            <p class="text-[11px] text-text-icon leading-relaxed">
              {{ t("views.setup.steps.step2.siteIcon.help2") }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </StepLayout>
</template>
