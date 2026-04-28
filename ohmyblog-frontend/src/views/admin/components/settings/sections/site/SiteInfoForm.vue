<!-- src/views/admin/components/settings/site/SiteInfoForm.vue -->
<script setup lang="ts">
import { ref } from "vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import FaviconUpload from "@/components/common/upload/FaviconUpload.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import { useToast } from "@/composables/toast.hook";
import { upsertConfig } from "@/api/config.api";

const { t } = useLang();
const systemStore = useSystemStore();
const isSubmitting = ref(false);

/**
 * 保存基本设置
 */
const handleSave = async () => {
  isSubmitting.value = true;
  try {
    await upsertConfig({
      configKey: "site_info",
      configValue: systemStore.siteInfo,
      description: "Basic Site Settings",
    });
    useToast.success(t("api.success.保存成功"));
  } catch (error) {
    // 错误处理已在 API 层由 Toast 覆盖
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <SettingCard
    class="w-full lg:w-120"
    :title="t('views.admin.Settings.site.siteInfo.title')"
    :description="t('views.admin.Settings.site.siteInfo.description')"
  >
    <div class="flex flex-col gap-8">
        <!-- 1. 站点标题 -->
        <TipInput
          v-model="systemStore.siteInfo.title"
          :label="t('views.setup.steps.step2.siteTitle.label')"
          :placeholder="t('views.setup.steps.step2.siteTitle.placeholder')"
          :hint="t('views.setup.steps.step2.siteTitle.hint')"
        />

        <!-- 2. 站点图标 -->
        <FaviconUpload v-model="systemStore.siteInfo.favicon" />
      </div>

      <template #footer>
        <div class="flex justify-end pt-4">
          <ButtonPrimary
            :text="t('common.save')"
            :loading="isSubmitting"
            @click="handleSave"
            class="min-w-32"
          />
        </div>
      </template>
    </SettingCard>
</template>

<style scoped></style>
