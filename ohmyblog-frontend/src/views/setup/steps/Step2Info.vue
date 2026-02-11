<!-- src/views/setup/steps/Step2Info.vue -->
<script setup lang="ts">
import { ref } from "vue";
import TipInput from "@/components/common/input/TipInput.vue";
import StepLayout from "../components/StepLayout.vue";
import ImageUpload from "@/components/base/upload/ImageUpload.vue";
import { useLang } from "@/composables/lang.hook";
import { useSetupStep, type Validatable } from "@/composables/setup-step.hook";
import { useImageUpload } from "@/composables/upload.hook";
import { upsertConfig } from "@/api/config.api";
import { uploadFavicon } from "@/api/upload.api";
import { useSystemStore } from "@/stores/system.store";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";

const { t } = useLang();
const { isSubmitting, runStep } = useSetupStep();
const systemStore = useSystemStore();

/**
 * 站点图标（Favicon）上传管理
 * 使用通用上传 Hook 统一处理图标的选择、上传状态与成功反馈
 */
const {
  loading: uploading, // 当前图标是否正在上传
  uploadRef: imageUploadRef, // 对 ImageUpload 组件实例的引用
  trigger: handleIconClick, // 触发文件选择对话框
  getButtonText, // 获取按钮文字
  handleUpload, // 核心上传执行逻辑
} = useImageUpload();

const titleInputRef = ref<Validatable | null>(null);

/**
 * 响应图标文件选择变更
 * @param file 选中的图标文件
 */
const handleFileChange = (file: File) => {
  handleUpload(
    file,
    uploadFavicon, // 调用后端图标上传接口
    () => {
      /**
       * 成功回调：同步全局 Store
       * 约定路径：/api/uploads/system/favicon.png
       * 附加时间戳 (?t=...) 用于绕过浏览器图片缓存，确保预览即时更新
       */
      systemStore.siteInfo.favicon = `/api/uploads/system/favicon.png?t=${Date.now()}`;
    },
    "api.success.config.保存成功", // 成功时的 i18n 提示 Key
  );
};

const handleNext = () => {
  runStep(
    async () => {
      return upsertConfig({
        configKey: "site_info",
        configValue: systemStore.siteInfo,
        description: "站点基本信息（标题、图标、页脚、备案号）",
      });
    },
    { validate: [titleInputRef.value] },
  );
};
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
      <label class="block text-sm font-medium text-fg pb-1">
        {{ t("views.setup.steps.step2.siteIcon.label") }}
      </label>
      <div class="flex items-start gap-5">
        <!-- 预览区域 -->
        <div class="shrink-0">
          <ImageUpload
            ref="imageUploadRef"
            v-model="systemStore.siteInfo.favicon"
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
              class="text-sm"
              @click="handleIconClick"
              :disabled="uploading"
              :text="
                getButtonText(
                  'views.setup.steps.step2.siteIcon',
                  systemStore.siteInfo.favicon,
                )
              "
            />

            <BaseTag v-if="systemStore.siteInfo.favicon" type="success">
              {{ t("views.setup.steps.step2.siteIcon.success") }}
            </BaseTag>
          </div>

          <div class="mt-3 space-y-1">
            <p class="text-[11px] text-fg-subtle leading-relaxed">
              {{ t("views.setup.steps.step2.siteIcon.help1") }}
            </p>
            <p class="text-[11px] text-fg-subtle leading-relaxed">
              {{ t("views.setup.steps.step2.siteIcon.help2") }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </StepLayout>
</template>
