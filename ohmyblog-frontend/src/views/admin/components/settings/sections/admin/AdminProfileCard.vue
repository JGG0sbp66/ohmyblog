<!-- src/views/admin/components/settings/sections/admin/AdminProfileCard.vue -->
<script setup lang="ts">
import { ref } from "vue";
import ProfileCard from "@/components/common/item/ProfileCard.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import { useSystemStore } from "@/stores/system.store";
import { useLang } from "@/composables/lang.hook";
import { upsertConfig } from "@/api/config.api";
import { useToast } from "@/composables/toast.hook";
import { PersonalInfoConfigUpsertDTO } from "@server/dtos/config.dto";
import SocialLinkListEditor from "./SocialLinkListEditor.vue";

const { t } = useLang();
const systemStore = useSystemStore();
const isSubmitting = ref(false);

// 获取校验 Schema
const profileSchema =
  PersonalInfoConfigUpsertDTO.properties.configValue.properties;

/**
 * 处理保存
 */
const handleSave = async () => {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;

    // 提交整体配置
    await upsertConfig({
      configKey: "personal_info",
      configValue: systemStore.personalInfo,
    });

    useToast.success(t("api.success.保存成功"));
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <SettingCard
    :title="t('views.admin.Settings.admin.profile.title')"
    :description="t('views.admin.Settings.admin.profile.description')"
  >
    <div class="flex flex-col gap-10">
      <!-- 个人简介 -->
      <TipInput
        v-model="systemStore.personalInfo.bio"
        :label="t('views.admin.Settings.admin.profile.bio')"
        :placeholder="t('views.admin.Settings.admin.profile.bioPlaceholder')"
        :schema="profileSchema.bio"
      />

      <!-- 社交链接 (组件化列表) -->
      <SocialLinkListEditor />
    </div>

    <template #footer>
      <div class="flex justify-end pt-4">
        <ButtonPrimary
          class="min-w-32"
          :loading="isSubmitting"
          @click="handleSave"
          :text="t('common.save')"
        />
      </div>
    </template>
  </SettingCard>
</template>
