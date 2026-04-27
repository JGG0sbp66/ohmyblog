<script setup lang="ts">
import { ref } from "vue";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { uploadSocialIcon } from "@/api/upload.api";
import TipInput from "@/components/common/input/TipInput.vue";
import ImageUpload from "@/components/base/upload/ImageUpload.vue";

interface Props {
  id: string;
  name: string;
  url: string;
  icon?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update", id: string, data: { name?: string; url?: string; icon?: string }): void;
}>();

const { t } = useLang();
const uploading = ref(false);
const nameError = ref("");

// 处理文件选择
const handleFileChange = async (file: File) => {
  // 如果名称为空，提示用户先填写名称
  const trimmedName = props.name.trim();
  if (!trimmedName) {
    nameError.value = t("views.admin.Settings.admin.social.links.nameRequired");
    return;
  }

  // 清除错误状态
  nameError.value = "";

  try {
    uploading.value = true;
    // 立即上传，使用 name 作为文件名（key）
    const result = await uploadSocialIcon(file, trimmedName);
    if (result?.url) {
      emit("update", props.id, { icon: result.url });
      useToast.success(t("api.success.上传完成"));
    }
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    uploading.value = false;
  }
};
</script>

<template>
  <div class="flex items-start gap-3 w-full">
    <!-- 名称 (Key) -->
    <div class="w-40">
      <TipInput
        :model-value="name"
        :external-error="nameError"
        :placeholder="t('views.admin.Settings.admin.social.links.namePlaceholder')"
        @update:model-value="
          nameError = '';
          emit('update', id, { name: String($event) });
        "
      />
    </div>

    <!-- URL (Value) -->
    <div class="flex-1">
      <TipInput
        :model-value="url"
        :placeholder="t('views.admin.Settings.admin.social.links.urlPlaceholder')"
        @update:model-value="emit('update', id, { url: String($event) })"
      />
    </div>

    <!-- 图标上传 (Icon) -->
    <div class="shrink-0 h-11 flex items-center">
      <ImageUpload
        :model-value="icon"
        :loading="uploading"
        width="w-10"
        height="h-10"
        rounded-class="rounded-lg"
        @change="handleFileChange"
      />
    </div>
  </div>
</template>
