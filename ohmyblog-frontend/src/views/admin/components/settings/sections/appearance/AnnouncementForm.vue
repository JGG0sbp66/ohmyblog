<!-- src/views/admin/components/settings/sections/appearance/AnnouncementForm.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import ModuleItem from "@/components/common/item/ModuleItem.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import TipTextarea from "@/components/common/input/TipTextarea.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import { useToast } from "@/composables/toast.hook";
import { upsertConfig } from "@/api/config.api";
import { publishPreviewDraft } from "@/composables/preview-bridge.hook";
import { AnnouncementConfigUpsertDTO } from "@server/dtos/config.dto";
import type { Validatable } from "@/composables/setup-step.hook";

const { t } = useLang();
const systemStore = useSystemStore();
const isSubmitting = ref(false);
const titleRef = ref<Validatable | null>(null);
const contentRef = ref<Validatable | null>(null);

// 开关切换时表单字段的展开/收起动画，与 SMTP 设置保持一致
const [parentRef] = useAutoAnimate();

const titleSchema =
  AnnouncementConfigUpsertDTO.properties.configValue.properties.title;
const contentSchema =
  AnnouncementConfigUpsertDTO.properties.configValue.properties.content;

/*
  边改边推给预览 iframe
  iframe 是独立文档、独立 Pinia 实例，读不到本页的 store，只能靠这条同源广播
*/
watch(
  () => systemStore.announcement,
  (value) => publishPreviewDraft({ announcement: { ...value } }),
  { deep: true, immediate: true },
);

/**
 * 保存公告设置
 * 关闭状态下只保存开关本身，不强制正文通过校验
 */
const handleSave = async () => {
  if (systemStore.announcement.enabled) {
    const titleOk = titleRef.value?.validate() ?? true;
    const contentOk = contentRef.value?.validate() ?? true;
    if (!titleOk || !contentOk) return;
  }

  isSubmitting.value = true;
  try {
    await upsertConfig({
      configKey: "announcement",
      configValue: systemStore.announcement,
    });
    useToast.success(t("api.success.保存成功"));
  } catch (error: any) {
    // unwrap 只 throw 不 toast，这里不接住的话保存失败就是一片安静，
    // 用户以为存上了，关页走人改动即丢
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <SettingCard
    :title="t('views.admin.Settings.announcement.section.title')"
    :description="t('views.admin.Settings.announcement.section.description')"
  >
    <div ref="parentRef" class="flex flex-col gap-6">
      <!-- 1. 显示开关 -->
      <ModuleItem
        v-model="systemStore.announcement.enabled"
        :title="t('views.admin.Settings.announcement.enabled.label')"
        :description="
          t('views.admin.Settings.announcement.enabled.description')
        "
      />

      <template v-if="systemStore.announcement.enabled">
        <!-- 2. 公告标题 -->
        <TipInput
          ref="titleRef"
          v-model="systemStore.announcement.title"
          :label="t('views.admin.Settings.announcement.title.label')"
          :placeholder="
            t('views.admin.Settings.announcement.title.placeholder')
          "
          :hint="t('views.admin.Settings.announcement.title.hint')"
          :schema="titleSchema"
        />

        <!-- 3. 公告正文 -->
        <TipTextarea
          ref="contentRef"
          v-model="systemStore.announcement.content"
          :label="t('views.admin.Settings.announcement.content.label')"
          :placeholder="
            t('views.admin.Settings.announcement.content.placeholder')
          "
          :hint="t('views.admin.Settings.announcement.content.hint')"
          :schema="contentSchema"
          :rows="6"
          required
        />
      </template>
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
