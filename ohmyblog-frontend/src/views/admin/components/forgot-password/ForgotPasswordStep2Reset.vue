<!-- src/views/admin/components/forgot-password/ForgotPasswordStep2Reset.vue -->
<!--
  忘记密码 - 第二步：输入验证码 + 新密码
  纯展示组件，所有副作用通过 emit 上抛由父页面处理
-->
<script setup lang="ts">
import { useTemplateRef } from "vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonThird from "@/components/base/button/ButtonThird.vue";
import { ResetPasswordDTO } from "@server/dtos/auth.dto";
import { useLang } from "@/composables/lang.hook";
import type { Validatable } from "@/composables/setup-step.hook";
import type { ForgotPasswordForm } from "./types";

defineProps<{
  form: ForgotPasswordForm;
  isSubmitting: boolean;
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

const handleSubmit = () => {
  const codeValid = codeRef.value?.validate();
  const passwordValid = newPasswordRef.value?.validate();
  if (!codeValid || !passwordValid) return;
  emit("submit");
};

</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 标题 -->
    <div class="flex flex-col gap-2 onload-animation">
      <h1 class="text-2xl font-bold text-fg">
        {{ t("views.forgotPassword.step2.title") }}
      </h1>
      <p class="text-fg-subtle text-sm">
        {{ t("views.forgotPassword.step2.description") }}
      </p>
    </div>

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
          :hint="t('views.forgotPassword.step2.code.hint')"
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
          :text="t('views.forgotPassword.step2.resend')"
          :disabled="isSubmitting"
          @click="emit('resend')"
        />
        <ButtonThird
          :text="t('views.forgotPassword.step2.back')"
          @click="emit('back')"
        />
      </div>
    </form>
  </div>
</template>
