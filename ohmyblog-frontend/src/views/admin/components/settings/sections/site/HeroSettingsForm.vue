<!-- src/views/admin/components/settings/site/HeroSettingsForm.vue -->
<script setup lang="ts">
import SettingCard from "@/components/base/card/SettingCard.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import { useToast } from "@/composables/toast.hook";
import { upsertConfig } from "@/api/config.api";
import { ref } from "vue";

// 引入现有的编辑器组件以保持功能和视觉高度统一
import HeroMainTitleEditor from "@/views/main/components/hero/editors/title/HeroMainTitleEditor.vue";
import HeroSubtitleEditor from "@/views/main/components/hero/editors/title/subtitle/HeroSubtitleEditor.vue";

const { t } = useLang();
const systemStore = useSystemStore();
const isSubmitting = ref(false);

const handleSave = async () => {
  isSubmitting.value = true;
  try {
    await upsertConfig({
      configKey: "personal_info",
      configValue: systemStore.personalInfo,
      description: "Hero Title Settings",
    });
    useToast.success(t("api.success.保存成功"));
  } catch (error) {
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <SettingCard
    class="w-full lg:w-120"
    :title="t('views.main.hero.titleEditor.modalTitle')"
    :description="t('views.admin.Settings.site.hero.description')"
  >
    <div class="flex flex-col gap-8">
        <!-- 直接复用成熟的编辑器组件 -->
        <HeroMainTitleEditor />
        <HeroSubtitleEditor :page-size="5" />
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
