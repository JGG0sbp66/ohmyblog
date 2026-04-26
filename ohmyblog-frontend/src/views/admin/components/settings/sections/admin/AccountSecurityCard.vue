<!-- src/views/admin/components/settings/sections/admin/AccountSecurityCard.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import { useAuthStore } from "@/stores/auth.store";
import { useLang } from "@/composables/lang.hook";
import { updateAccount } from "@/api/auth.api";
import { useToast } from "@/composables/toast.hook";
import { UpdateAccountDTO } from "@server/dtos/auth.dto";

const { t } = useLang();
const authStore = useAuthStore();
const isSubmitting = ref(false);
const formRefs = ref<any[]>([]);

// 账号表单数据
const form = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});

// 获取校验 Schema
const schema = UpdateAccountDTO.properties;

// 初始化数据回显
onMounted(() => {
  if (authStore.user) {
    form.username = authStore.user.username;
    form.email = authStore.user.email || "";
  }
});

/**
 * 收集表单引用
 */
const setFormRef = (el: any) => {
  if (el) formRefs.value.push(el);
};

/**
 * 处理保存
 */
const handleSave = async () => {
  if (isSubmitting.value) return;

  // 1. 触发所有输入框校验
  let isValid = true;
  for (const inputRef of formRefs.value) {
    if (inputRef.validate && !inputRef.validate()) {
      isValid = false;
    }
  }

  // 2. 校验两次密码是否一致
  if (form.password && form.password !== form.confirmPassword) {
    useToast.error(t("views.setup.steps.step3.confirm.error"));
    isValid = false;
  }

  if (!isValid) return;

  try {
    isSubmitting.value = true;
    await updateAccount({
      username: form.username,
      email: form.email,
      password: form.password || undefined,
    });

    // 成功后刷新用户信息
    await authStore.fetchMe();

    // 重置密码框
    form.password = "";
    form.confirmPassword = "";

    useToast.success(t("api.success.保存成功"));
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isSubmitting.value = false;
    formRefs.value = []; // 清空以便下次重新收集
  }
};
</script>

<template>
  <SettingCard
    :title="t('views.admin.Settings.admin.account.title')"
    :description="t('views.admin.Settings.admin.account.description')"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <!-- 用户名 -->
      <TipInput
        :ref="setFormRef"
        v-model="form.username"
        :label="t('views.setup.steps.step3.username.label')"
        :placeholder="t('views.setup.steps.step3.username.placeholder')"
        :schema="schema.username"
        required
      />

      <!-- 电子邮箱 -->
      <TipInput
        :ref="setFormRef"
        v-model="form.email"
        type="email"
        :label="t('views.setup.steps.step3.email.label')"
        :placeholder="t('views.setup.steps.step3.email.placeholder')"
        :hint="t('views.setup.steps.step3.email.hint')"
        :schema="schema.email"
        required
      />

      <!-- 新密码 -->
      <TipInput
        :ref="setFormRef"
        v-model="form.password"
        type="password"
        :label="t('views.setup.steps.step3.password.label')"
        :placeholder="
          t('views.admin.Settings.admin.account.passwordPlaceholder')
        "
        :schema="schema.password"
      />

      <!-- 确认新密码 -->
      <TipInput
        v-model="form.confirmPassword"
        type="password"
        :label="t('views.setup.steps.step3.confirm.label')"
        :placeholder="t('views.setup.steps.step3.confirm.placeholder')"
      />
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
