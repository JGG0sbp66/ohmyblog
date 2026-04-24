<!-- src/views/main/components/hero/editors/title/HeroMainTitleEditor.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { upsertConfig } from "@/api/config.api";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { useSystemStore } from "@/stores/system.store";

const { t } = useLang();

// 主标题直接绑定到 store，输入即改内存态配置。
const systemStore = useSystemStore();
const isSubmitting = ref(false);

const handleSaveTitle = async () => {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;

    const res = await upsertConfig({
      configKey: "personal_info",
      configValue: {
        ...systemStore.personalInfo,
        heroTitle: systemStore.personalInfo.heroTitle,
      },
    });

    // 成功提示使用接口返回的 message 作为 i18n key。
    if (res?.message) {
      useToast.success(t(`api.success.${res.message}`));
    }
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="space-y-3">
    <!-- 第一行：左侧标题，右侧保存按钮 -->
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-bold tracking-wide text-fg-subtle uppercase">
        {{ t("views.main.hero.titleEditor.mainTitle") }}
      </h3>
      <ButtonPrimary
        :text="t('common.save')"
        class="min-w-28"
        :loading="isSubmitting"
        @click="handleSaveTitle"
      />
    </div>

    <!-- 第二行：主标题输入框 -->
    <TipInput
      v-model="systemStore.personalInfo.heroTitle"
      :placeholder="t('views.main.hero.titleEditor.placeholder')"
    />
  </div>
</template>
