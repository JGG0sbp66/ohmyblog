<!-- src/views/admin/components/forgot-password/ForgotPasswordStep2Reset.vue -->
<!--
  忘记密码 - 第二步：输入验证码 + 新密码
  纯展示组件，所有副作用通过 emit 上抛由父页面处理
-->
<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import AuthCard from "@/components/base/card/AuthCard.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonThird from "@/components/base/button/ButtonThird.vue";
import { ResetPasswordDTO } from "@server/dtos/auth.dto";
import { useLang } from "@/composables/lang.hook";
import type { Validatable } from "@/composables/setup-step.hook";
import {
  RESET_PASSWORD_CODE_TTL_MIN,
  type ForgotPasswordForm,
} from "@/api/shared";

const props = defineProps<{
  form: ForgotPasswordForm;
  isSubmitting: boolean;
  /** 重发冷却剩余秒数，大于 0 时禁用重发按钮 */
  resendCountdown: number;
}>();

const emit = defineEmits<{
  /** 通过校验后由父组件请求重置接口 */
  submit: [];
  /** 重新发送验证码 */
  resend: [];
  /** 返回上一步（重新输入邮箱） */
  back: [];
}>();

const { t } = useLang();
const codeRef = useTemplateRef<Validatable>("codeRef");
const newPasswordRef = useTemplateRef<Validatable>("newPasswordRef");

/** 冷却中显示剩余秒数，否则显示原文案 */
const resendText = computed(() =>
  props.resendCountdown > 0
    ? t("views.forgotPassword.step2.resendCooldown", {
        seconds: props.resendCountdown,
      })
    : t("views.forgotPassword.step2.resend"),
);

const handleSubmit = () => {
  const codeValid = codeRef.value?.validate();
  const passwordValid = newPasswordRef.value?.validate();
  if (!codeValid || !passwordValid) return;
  emit("submit");
};
</script>

<template>
  <AuthCard
    :title="t('views.forgotPassword.step2.title')"
    :description="t('views.forgotPassword.step2.description')"
  >
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
      <!-- 邮箱（只读，由 step1 带过来） -->
      <div class="onload-animation anim-delay-50">
        <TipInput
          v-model="form.email"
          :label="t('views.forgotPassword.step2.email.label')"
          readonly
        />
      </div>

      <!-- 验证码 -->
      <div class="onload-animation anim-delay-75">
        <TipInput
          ref="codeRef"
          v-model="form.code"
          :label="t('views.forgotPassword.step2.code.label')"
          :placeholder="t('views.forgotPassword.step2.code.placeholder')"
          :hint="
            t('views.forgotPassword.step2.code.hint', {
              minutes: RESET_PASSWORD_CODE_TTL_MIN,
            })
          "
          :schema="ResetPasswordDTO.properties.code"
          required
        />
      </div>

      <!-- 新密码 -->
      <div class="onload-animation anim-delay-100">
        <TipInput
          ref="newPasswordRef"
          v-model="form.newPassword"
          type="password"
          :label="t('views.forgotPassword.step2.newPassword.label')"
          :placeholder="t('views.forgotPassword.step2.newPassword.placeholder')"
          :schema="ResetPasswordDTO.properties.newPassword"
          required
        />
      </div>

      <!-- 人机验证：给「重新发送」用的，组件本身由父页面持有 -->
      <slot name="captcha" />

      <!-- 提交 -->
      <div class="pt-4 onload-animation anim-delay-150">
        <ButtonPrimary
          :text="t('views.forgotPassword.step2.submit')"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          class="w-full py-2"
        />
      </div>

      <!-- 辅助操作：重发 / 返回 -->
      <div
        class="flex items-center justify-between text-xs onload-animation anim-delay-200"
      >
        <ButtonThird
          :text="resendText"
          :disabled="isSubmitting || resendCountdown > 0"
          @click="emit('resend')"
        />
        <ButtonThird
          :text="t('views.forgotPassword.step2.back')"
          @click="emit('back')"
        />
      </div>
    </form>
  </AuthCard>
</template>
