<!-- src/views/setup/steps/Step3Admin.vue -->
<script setup lang="ts">
import { ref, reactive } from "vue";
import TipInput from "@/components/common/input/TipInput.vue";
import StepLayout from "../components/StepLayout.vue";
import { useLang } from "@/composables/lang.hook";
import { useSetupStep, type Validatable } from "@/composables/setup-step.hook";
import { register, login } from "@/api/auth.api";
import { RegisterDTO, type TRegisterDTO } from "@server/dtos/auth.dto";

const { t } = useLang();
const { isSubmitting, runStep } = useSetupStep();

const usernameRef = ref<Validatable | null>(null);
const emailRef = ref<Validatable | null>(null);
const passwordRef = ref<Validatable | null>(null);
const confirmPasswordRef = ref<Validatable | null>(null);

const confirmError = ref("");

type RegisterForm = TRegisterDTO & { confirmPassword: string };

const form = reactive<RegisterForm>({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});

// 仅做确认密码一致性校验（复杂规则仍在 DTO schema 内）
const validateConfirmPassword = () => {
  confirmError.value = "";
  if (form.password !== form.confirmPassword) {
    confirmError.value = t("views.setup.steps.step3.confirm.error");
    return false;
  }
  return true;
};

// 提交前：先校验确认密码，再交给 runStep 执行后端请求
const handleNext = () => {
  if (!validateConfirmPassword()) return;

  runStep(
    async () => {
      // 1. 注册管理员账号
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
      });

      // 2. 注册成功后立即登录，以获取后续操作所需的 Cookie/Token
      return login({
        identifier: form.username,
        password: form.password,
      });
    },
    {
      validate: [
        usernameRef.value,
        emailRef.value,
        passwordRef.value,
        confirmPasswordRef.value,
      ],
    },
  );
};
</script>

<template>
  <StepLayout
    :title="t('views.setup.steps.step3.title')"
    :description="t('views.setup.steps.step3.description')"
    :loading="isSubmitting"
    @next="handleNext"
  >
    <!-- 用户名 -->
    <TipInput
      ref="usernameRef"
      v-model="form.username"
      :label="t('views.setup.steps.step3.username.label')"
      :placeholder="t('views.setup.steps.step3.username.placeholder')"
      :schema="RegisterDTO.properties.username"
      required
    />

    <!-- 邮箱 -->
    <TipInput
      ref="emailRef"
      v-model="form.email"
      type="email"
      :label="t('views.setup.steps.step3.email.label')"
      :placeholder="t('views.setup.steps.step3.email.placeholder')"
      :schema="RegisterDTO.properties.email"
      required
    />

    <!-- 密码 -->
    <TipInput
      ref="passwordRef"
      v-model="form.password"
      type="password"
      :label="t('views.setup.steps.step3.password.label')"
      :placeholder="t('views.setup.steps.step3.password.placeholder')"
      :schema="RegisterDTO.properties.password"
      required
    />

    <!-- 确认密码 -->
    <TipInput
      ref="confirmPasswordRef"
      v-model="form.confirmPassword"
      type="password"
      :label="t('views.setup.steps.step3.confirm.label')"
      :placeholder="t('views.setup.steps.step3.confirm.placeholder')"
      :external-error="confirmError"
      @input="validateConfirmPassword"
      required
    />
  </StepLayout>
</template>
