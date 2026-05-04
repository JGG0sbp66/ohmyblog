<!-- src/views/main/components/hero/editors/title/HeroTitleEditorModal.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { upsertConfig } from "@/api/config.api";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BaseModal from "@/components/base/pop/BaseModal.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { RiHeading } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { useSystemStore } from "@/stores/system.store";
import HeroSubtitleEditor from "./subtitle/HeroSubtitleEditor.vue";
import HeroMainTitleEditor from "./HeroMainTitleEditor.vue";

const { t } = useLang();
const systemStore = useSystemStore();
const isSubmitting = ref(false);

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const handleSave = async () => {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;

    const res = await upsertConfig({
      configKey: "personal_info",
      configValue: {
        ...systemStore.personalInfo,
      },
    });

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
  <!-- 该组件负责弹窗容器、编辑区布局与统一保存逻辑。 -->
  <BaseModal
    :model-value="modelValue"
    @update:modelValue="(value) => emit('update:modelValue', value)"
    maxWidth="max-w-2xl"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <RiHeading class="w-5 h-5 text-accent" />
        <h2 class="text-xl font-bold text-fg">
          {{ t("views.main.hero.titleEditor.modalTitle") }}
        </h2>
      </div>
    </template>

    <div class="flex flex-col gap-8">
      <HeroMainTitleEditor />

      <HeroSubtitleEditor :page-size="5" />
    </div>

    <template #footer>
      <div class="ml-auto flex items-center gap-3">
        <ButtonSecondary
          :text="t('common.cancel')"
          @click="emit('update:modelValue', false)"
          class="min-w-24 py-2"
        />
        <ButtonPrimary
          :text="t('common.save')"
          :loading="isSubmitting"
          @click="handleSave"
          class="min-w-24 py-2"
        />
      </div>
    </template>
  </BaseModal>
</template>
