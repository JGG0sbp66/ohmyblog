<!-- src/views/admin/components/settings/site/HeroSettingsForm.vue -->
<script setup lang="ts">
import SettingCard from "@/components/base/card/SettingCard.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ModuleItem from "@/components/common/item/ModuleItem.vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import { useToast } from "@/composables/toast.hook";
import { upsertConfig } from "@/api/config.api";
import HeroUploadSetting from "@/views/setup/components/HeroUploadSetting.vue";
import { computed, ref } from "vue";

// 引入现有的编辑器组件以保持功能和视觉高度统一
import HeroMainTitleEditor from "@/views/main/components/hero/editors/title/HeroMainTitleEditor.vue";
import HeroSubtitleEditor from "@/views/main/components/hero/editors/title/subtitle/HeroSubtitleEditor.vue";

const { t } = useLang();
const systemStore = useSystemStore();
const isSubmitting = ref(false);

// 开关切换时下方表单的展开/收起动画，与公告设置保持一致
const [parentRef] = useAutoAnimate();

/**
 * ModuleItem 的 v-model 要求 boolean，而 heroEnabled 在 DTO 里是可选的
 * （开关是后加的，存量配置没有这个字段）。这里把 undefined 归一成 true，
 * 「缺省即开启」的语义只在这一处表达，与 HeroSection 的渲染判断口径一致。
 */
const heroEnabled = computed({
  get: () => systemStore.personalInfo.heroEnabled !== false,
  set: (value: boolean) => {
    systemStore.personalInfo.heroEnabled = value;
  },
});

const handleSave = async () => {
  isSubmitting.value = true;
  try {
    await upsertConfig({
      configKey: "personal_info",
      configValue: systemStore.personalInfo,
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
    class="w-full lg:w-120"
    :title="t('views.main.hero.titleEditor.modalTitle')"
    :description="t('views.admin.Settings.site.hero.description')"
  >
    <div ref="parentRef" class="flex flex-col gap-8">
      <!-- 启用开关：关掉只是不渲染横幅，已上传的图与标题都留着 -->
      <ModuleItem
        v-model="heroEnabled"
        :title="t('views.admin.Settings.site.hero.enabled.label')"
        :description="t('views.admin.Settings.site.hero.enabled.description')"
      />

      <template v-if="heroEnabled">
        <HeroUploadSetting v-model="systemStore.personalInfo.hero" />

        <!-- 直接复用成熟的编辑器组件 -->
        <HeroMainTitleEditor />
        <HeroSubtitleEditor :page-size="5" />
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
