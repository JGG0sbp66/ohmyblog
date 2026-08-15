<!-- src/views/admin/pages/ForgotPassword.page.vue -->
<!--
  忘记密码 - 单页面容器
  - 状态、API 调用、step 切换都在这里
  - UI 拆给两个子组件 ForgotPasswordStep1Email / ForgotPasswordStep2Reset
  - 不开两条路由：浏览器后退会让 step 1 输入的 email 丢失
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AuthLayout from "@/views/admin/components/layout/AuthLayout.vue";
import ForgotPasswordStep1Email from "@/views/admin/components/forgot-password/ForgotPasswordStep1Email.vue";
import ForgotPasswordStep2Reset from "@/views/admin/components/forgot-password/ForgotPasswordStep2Reset.vue";
import ForgotPasswordUnavailable from "@/views/admin/components/forgot-password/ForgotPasswordUnavailable.vue";
import CaptchaWidget from "@/components/common/captcha/CaptchaWidget.vue";
import {
  RESET_PASSWORD_RESEND_COOLDOWN_SEC,
  type ForgotPasswordForm,
} from "@/api/shared";
import {
  forgotPassword,
  getForgotPasswordAvailability,
  resetPassword,
} from "@/api/auth.api";
import { useCaptcha } from "@/composables/captcha.hook";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { useTemplateRef } from "vue";
const router = useRouter();
const { t } = useLang();

// 当前步骤：1 = 输入邮箱，2 = 输入验证码 + 新密码
const step = ref<1 | 2>(1);
const isSubmitting = ref(false);

/**
 * 邮件服务是否可用。null 表示还没问到结果。
 *
 * 没配 SMTP 时后端只能静默失败（返回报错会让接口变成邮箱枚举器），
 * 所以必须先问一次，否则用户会对着一个永远收不到邮件的表单一直提交
 */
const emailAvailable = ref<boolean | null>(null);

onMounted(async () => {
  loadCaptcha();
  try {
    const res = await getForgotPasswordAvailability();
    emailAvailable.value = res?.available ?? true;
  } catch {
    // 查询本身失败（比如网络问题）时按可用处理，不要因为一个辅助接口
    // 就把正常用户挡在恢复流程之外
    emailAvailable.value = true;
  }
});

// === 人机验证 ===
//
// 验证框由本组件持有、通过插槽塞进当前那一步里 —— 两次调用
// /auth/forgot-password 的地方（step1 的发送、step2 的重新发送）都在这里，
// 凭证的取用和作废跟着调用方走，不用在两个子组件之间同步状态。
//
// step2 也要有一个：重新发送打的是同一个接口，同样要过验证码，而上一个
// 凭证在 step1 提交时就已经用掉了。
const { config: captchaConfig, load: loadCaptcha, isEnabledFor } = useCaptcha();
const captchaRef =
  useTemplateRef<InstanceType<typeof CaptchaWidget>>("captchaRef");
const captchaToken = ref("");

/**
 * 取一个凭证；该入口没开启验证码时返回 undefined（不需要带）。
 * @returns 需要但没拿到时返回 null，调用方据此中止提交
 */
const takeCaptchaToken = async (): Promise<string | undefined | null> => {
  if (!isEnabledFor("forgotPassword")) return undefined;

  const token = await captchaRef.value?.execute();
  if (!token) {
    useToast.error(t("components.common.captcha.required"));
    return null;
  }
  return token;
};

// === 重发冷却 ===
// 后端对同一账号有 RESET_PASSWORD_RESEND_COOLDOWN_SEC 的发信冷却，且冷却期内
// 是静默丢弃的。前端不跟着倒计时的话，用户点了"重新发送"看到成功提示却收不到
// 邮件，会以为坏了
const resendCountdown = ref(0);
let resendTimer: ReturnType<typeof setInterval> | undefined;

const startResendCooldown = () => {
  resendCountdown.value = RESET_PASSWORD_RESEND_COOLDOWN_SEC;
  clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    resendCountdown.value -= 1;
    if (resendCountdown.value <= 0) clearInterval(resendTimer);
  }, 1000);
};

onBeforeUnmount(() => clearInterval(resendTimer));

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
  const captchaToken = await takeCaptchaToken();
  if (captchaToken === null) return;

  isSubmitting.value = true;
  try {
    const res = await forgotPassword({ email: form.value.email, captchaToken });
    if (res?.message) {
      useToast.success(t(`api.success.${res.message}`));
    }
    startResendCooldown();
    step.value = 2;
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
    // 凭证一次性，失败后必须换一个新的
    captchaRef.value?.reset();
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
  if (isSubmitting.value || resendCountdown.value > 0) return;

  const captchaToken = await takeCaptchaToken();
  if (captchaToken === null) return;

  isSubmitting.value = true;
  try {
    const res = await forgotPassword({ email: form.value.email, captchaToken });
    if (res?.message) {
      useToast.success(t(`api.success.${res.message}`));
    }
    startResendCooldown();
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    // 无论成败都要换一个新凭证：成功时旧的已被后端消费掉，
    // 下次点重新发送还得再验一次
    captchaRef.value?.reset();
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
    <!-- 邮件服务不可用：整条流程走不通，直接给命令行恢复指引。
         emailAvailable 为 null 时还没问到结果，先渲染表单避免闪烁 -->
    <ForgotPasswordUnavailable
      v-if="emailAvailable === false"
      @back="router.push({ name: 'login' })"
    />
    <ForgotPasswordStep1Email
      v-else-if="step === 1"
      :form="form"
      :is-submitting="isSubmitting"
      @submit="handleSendCode"
      @back="router.push({ name: 'login' })"
    >
      <template #captcha>
        <CaptchaWidget
          v-if="
            isEnabledFor('forgotPassword') &&
            captchaConfig.provider &&
            captchaConfig.siteKey
          "
          ref="captchaRef"
          v-model="captchaToken"
          :provider="captchaConfig.provider"
          :site-key="captchaConfig.siteKey"
          action="forgot_password"
        />
      </template>
    </ForgotPasswordStep1Email>
    <ForgotPasswordStep2Reset
      v-else
      :form="form"
      :is-submitting="isSubmitting"
      :resend-countdown="resendCountdown"
      @submit="handleResetPassword"
      @resend="handleResend"
      @back="step = 1"
    >
      <!-- 重新发送打的也是 /auth/forgot-password，同样要过验证码 -->
      <template #captcha>
        <CaptchaWidget
          v-if="
            isEnabledFor('forgotPassword') &&
            captchaConfig.provider &&
            captchaConfig.siteKey
          "
          ref="captchaRef"
          v-model="captchaToken"
          :provider="captchaConfig.provider"
          :site-key="captchaConfig.siteKey"
          action="forgot_password_resend"
        />
      </template>
    </ForgotPasswordStep2Reset>
  </AuthLayout>
</template>
