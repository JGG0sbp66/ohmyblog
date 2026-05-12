<!-- src/views/main/components/friends/form/FriendLinkApplyForm.vue -->
<!--
  友链申请表单组件。
  包含站点名称、URL、图标 URL、简介、标签、联系邮箱字段，提交成功后通过 toast 提示并重置表单。
  标签约束（最大数量/字符数）直接从后端 DTO schema 读取，保持前后端一致。
-->
<script setup lang="ts">
import { ref } from "vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import TagsInput from "./TagsInput.vue";
import { applyFriendLink } from "@/api/friend-link.api";
import { ApplyFriendLinkDTO } from "@server/dtos/friend-link.dto";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

/** 从后端 DTO schema 读取标签约束，确保前后端一致 */
const tagsSchema = ApplyFriendLinkDTO.properties.tags as any;
/** 标签最大数量，对应 DTO tags.maxItems */
const TAG_MAX_ITEMS: number = tagsSchema.maxItems;
/** 单个标签最大字符数，对应 DTO tags.items.maxLength */
const TAG_MAX_LENGTH: number = tagsSchema.items.maxLength;

/** 需要手动触发校验的输入框 ref */
const nameRef = ref<InstanceType<typeof TipInput> | null>(null);
const urlRef = ref<InstanceType<typeof TipInput> | null>(null);
const emailRef = ref<InstanceType<typeof TipInput> | null>(null);

/** 返回一个空表单对象，用于初始化和重置 */
const emptyForm = () => ({
  name: "",
  url: "",
  avatarUrl: "",
  description: "",
  tags: [] as string[],
  applicantEmail: "",
});

/** 表单双向绑定数据 */
const form = ref(emptyForm());

/** 提交中状态，用于禁用按钮和显示 loading */
const submitting = ref(false);

/**
 * 提交友链申请。
 * 先触发必填字段校验，通过后调用接口；
 * 成功时弹出 toast 并重置表单，失败时弹出错误 toast。
 */
const handleSubmit = async () => {
  const nameOk = nameRef.value?.validate() ?? true;
  const urlOk = urlRef.value?.validate() ?? true;
  const emailOk = emailRef.value?.validate() ?? true;
  if (!nameOk || !urlOk || !emailOk) return;

  submitting.value = true;
  try {
    const result = await applyFriendLink({
      name: form.value.name.trim(),
      url: form.value.url.trim(),
      avatarUrl: form.value.avatarUrl.trim() || undefined,
      description: form.value.description.trim() || undefined,
      tags: form.value.tags.length > 0 ? form.value.tags : undefined,
      applicantEmail: form.value.applicantEmail.trim() || undefined,
    });
    if ((result as any)?.message) {
      useToast.success(t(`api.success.${(result as any).message}`));
    }
    form.value = emptyForm();
  } catch (error: any) {
    const errorMsg = typeof error === "string" ? error : error?.message || "Error";
    useToast.error(t(`api.errors.${errorMsg}`));
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <SettingCard
    :title="t('views.main.friends.applyTitle')"
    :description="t('views.main.friends.applyDesc')"
  >
    <!-- 表单字段 -->
    <form id="friend-link-form" class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <!-- 站点名 + URL 并排（桌面端） -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TipInput
          ref="nameRef"
          v-model="form.name"
          :label="t('views.main.friends.form.name')"
          :placeholder="t('views.main.friends.form.namePlaceholder')"
          required
        />
        <TipInput
          ref="urlRef"
          v-model="form.url"
          :label="t('views.main.friends.form.url')"
          :placeholder="t('views.main.friends.form.urlPlaceholder')"
          type="url"
          required
        />
      </div>

      <!-- 站点图标 URL + 站点简介 并排（桌面端） -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TipInput
          v-model="form.avatarUrl"
          :label="t('views.main.friends.form.avatarUrl')"
          :placeholder="t('views.main.friends.form.avatarUrlPlaceholder')"
          type="url"
        />
        <TipInput
          v-model="form.description"
          :label="t('views.main.friends.form.description')"
          :placeholder="t('views.main.friends.form.descPlaceholder')"
        />
      </div>

      <!-- 标签 -->
      <TagsInput
        v-model="form.tags"
        :label="t('views.main.friends.form.tags')"
        :placeholder="t('views.main.friends.form.tagsPlaceholder')"
        :max-tags="TAG_MAX_ITEMS"
        :max-tag-length="TAG_MAX_LENGTH"
      />

      <!-- 联系邮箱（可选） -->
      <TipInput
        ref="emailRef"
        v-model="form.applicantEmail"
        :label="t('views.main.friends.form.email')"
        :placeholder="t('views.main.friends.form.emailPlaceholder')"
        type="email"
        :hint="t('views.main.friends.form.emailHint')"
      />
    </form>

    <!-- 提交按钮放入 footer slot -->
    <template #footer>
      <div class="flex justify-end">
        <ButtonPrimary
          type="submit"
          form="friend-link-form"
          :loading="submitting"
          :text="t('views.main.friends.form.submit')"
        />
      </div>
    </template>
  </SettingCard>
</template>
