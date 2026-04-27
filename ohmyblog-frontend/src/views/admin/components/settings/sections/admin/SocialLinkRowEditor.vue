<script setup lang="ts">
import { ref } from "vue";
import { useLang } from "@/composables/lang.hook";
import { useImageUpload } from "@/composables/upload.hook";
import { uploadSocialIcon } from "@/api/upload.api";
import TipInput from "@/components/common/input/TipInput.vue";
import ImageUpload from "@/components/base/upload/ImageUpload.vue";

interface Props {
  id: string;
  name: string;
  url: string;
  iconLight?: string | null;
  iconDark?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (
    e: "update",
    id: string,
    data: {
      name?: string;
      url?: string;
      iconLight?: string;
      iconDark?: string;
    },
  ): void;
}>();

const { t } = useLang();
const uploader = useImageUpload();
const nameError = ref("");

// 处理文件选择
const handleFileChange = async (file: File, mode: "light" | "dark") => {
  // 如果名称为空，提示用户先填写名称
  const trimmedName = props.name.trim();
  if (!trimmedName) {
    nameError.value = t("views.admin.Settings.admin.social.links.nameRequired");
    return;
  }

  // 清除错误状态
  nameError.value = "";

  // 使用通用的 handleUpload 逻辑
  uploader.handleUpload(
    file,
    (f) => uploadSocialIcon(f, trimmedName, mode),
    (urlWithTimestamp) => {
      const updateData =
        mode === "light"
          ? { iconLight: urlWithTimestamp }
          : { iconDark: urlWithTimestamp };
      emit("update", props.id, updateData);
    },
  );
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
    <div class="shrink-0 flex items-center gap-2">
      <!-- 浅色模式上传 -->
      <div class="flex flex-col items-center gap-1">
        <ImageUpload
          :model-value="iconLight"
          :loading="uploader.loading.value"
          width="w-10"
          height="h-10"
          rounded-class="rounded-lg"
          @change="handleFileChange($event, 'light')"
        />
        <span class="text-[10px] text-fg-subtle scale-90">{{
          t("views.admin.Settings.admin.social.links.iconLight")
        }}</span>
      </div>

      <!-- 深色模式上传 -->
      <div class="flex flex-col items-center gap-1">
        <ImageUpload
          :model-value="iconDark"
          :loading="uploader.loading.value"
          width="w-10"
          height="h-10"
          rounded-class="rounded-lg"
          @change="handleFileChange($event, 'dark')"
        />
        <span class="text-[10px] text-fg-subtle scale-90">{{
          t("views.admin.Settings.admin.social.links.iconDark")
        }}</span>
      </div>
    </div>
  </div>
</template>
