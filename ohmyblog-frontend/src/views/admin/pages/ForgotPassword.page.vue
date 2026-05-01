<!-- src/views/admin/pages/ForgotPassword.page.vue -->
<!--
  忘记密码 - 单页面容器
  - 状态、API 调用、step 切换都在这里
  - UI 拆给两个子组件 ForgotPasswordStep1Email / ForgotPasswordStep2Reset
  - 不开两条路由：浏览器后退会让 step 1 输入的 email 丢失
-->
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthLayout from "@/views/admin/components/layout/AuthLayout.vue";
import ForgotPasswordStep1Email from "@/views/admin/components/forgot-password/ForgotPasswordStep1Email.vue";
import ForgotPasswordStep2Reset from "@/views/admin/components/forgot-password/ForgotPasswordStep2Reset.vue";
import type { ForgotPasswordForm } from "@/api/shared";
import { forgotPassword, resetPassword } from "@/api/auth.api";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
const router = useRouter();
const { t } = useLang();

// 当前步骤：1 = 输入邮箱，2 = 输入验证码 + 新密码
const step = ref<1 | 2>(1);
const isSubmitting = ref(false);

// 两个 step 共享的表单状态
const form = ref<ForgotPasswordForm>({
  email: "",
  code: "",
  newPassword: "",
});

/**
 * Step 1 提交：调用后端请求验证码 → 进入 step 2
 * 后端无论邮箱是否存在都返回成功，这里只要请求顺利就推进
 */
const handleSendCode = async () => {
  isSubmitting.value = true;
  try {
    const res = await forgotPassword({ email: form.value.email });
    if (res?.message) {
      useToast.success(t(`api.success.${res.message}`));
    }
    step.value = 2;
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isSubmitting.value = false;
  }
};

/** Step 2 提交：验证 code 与设置新密码 → 成功后跳转登录页 */
const handleResetPassword = async () => {
  isSubmitting.value = true;
  try {
    const res = await resetPassword({
      email: form.value.email,
      code: form.value.code,
      newPassword: form.value.newPassword,
    });
    if (res?.message) {
      useToast.success(t(`api.success.${res.message}`));
    }
    router.push({ name: "login" });
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isSubmitting.value = false;
  }
};

/** 重新发送验证码（在 step 2 上提供的便捷操作） */
const handleResend = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const res = await forgotPassword({ email: form.value.email });
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
  <AuthLayout
    :brand-line1="t('views.forgotPassword.brand.line1')"
    :brand-line2="t('views.forgotPassword.brand.line2')"
    :brand-line3="t('views.forgotPassword.brand.line3')"
  >
    <ForgotPasswordStep1Email
      v-if="step === 1"
      :form="form"
      :is-submitting="isSubmitting"
      @submit="handleSendCode"
      @back="router.push({ name: 'login' })"
    />
    <ForgotPasswordStep2Reset
      v-else
      :form="form"
      :is-submitting="isSubmitting"
      @submit="handleResetPassword"
      @resend="handleResend"
      @back="step = 1"
    />
  </AuthLayout>
</template>
