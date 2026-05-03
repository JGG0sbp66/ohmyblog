<!-- src/views/admin/components/forgot-password/ForgotPasswordStep1Email.vue -->
<!--
  忘记密码 - 第一步：输入邮箱、申请验证码
  纯展示组件，状态与提交逻辑由父页面持有
-->
<script setup lang="ts">
import { useTemplateRef } from "vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ArrowLeft from "@/components/icon/ui/ArrowLeft.vue";
import { ForgotPasswordDTO } from "@server/dtos/auth.dto";
import { useLang } from "@/composables/lang.hook";
import type { Validatable } from "@/composables/setup-step.hook";
import type { ForgotPasswordForm } from "@/api/shared";

defineProps<{
  form: ForgotPasswordForm;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  /** 表单校验通过后的提交事件，由父组件实际请求接口 */
  submit: [];
  /** 返回登录页 */
  back: [];
}>();

const { t } = useLang();
const emailRef = useTemplateRef<Validatable>("emailRef");

const handleSubmit = () => {
  if (!emailRef.value?.validate()) return;
  emit("submit");
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 标题 -->
    <div class="flex flex-col gap-2 onload-animation">
      <h1 class="text-2xl font-bold text-fg">
        {{ t("views.forgotPassword.step1.title") }}
      </h1>
      <p class="text-fg-subtle text-sm">
        {{ t("views.forgotPassword.step1.description") }}
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
      <!-- 邮箱 -->
      <div class="onload-animation anim-delay-50">
        <TipInput
          ref="emailRef"
          v-model="form.email"
          type="email"
          :label="t('views.forgotPassword.step1.email.label')"
          :placeholder="t('views.forgotPassword.step1.email.placeholder')"
          :schema="ForgotPasswordDTO.properties.email"
          required
        />
      </div>

      <!-- 提交按钮 -->
      <div class="pt-4 onload-animation anim-delay-100">
        <ButtonPrimary
          :text="t('views.forgotPassword.step1.submit')"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          class="w-full py-2"
        />
      </div>

      <!-- 分割线 -->
      <div class="border-t border-fg-muted/15"></div>

      <!-- 返回登录 -->
      <div class="onload-animation anim-delay-150">
        <ButtonSecondary
          :text="t('views.forgotPassword.step1.backToLogin')"
          @click="emit('back')"
          class="w-full px-4! py-2!"
        >
          <ArrowLeft />
        </ButtonSecondary>
      </div>
    </form>
  </div>
</template>
