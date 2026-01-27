<!-- src/views/setup/steps/Step3Admin.vue -->
<script setup lang="ts">
import { ref, reactive } from "vue";
import TipInput from "@/components/common/input/TipInput.vue";
import StepLayout from "./StepLayout.vue";
import { useLang } from "@/composables/lang.hook";
import { useSetupStep, type Validatable } from "@/composables/setup-step.hook";
import { useToast } from "@/composables/toast.hook";
import { register, login } from "@/api/auth.api";

const { t } = useLang();
const { isSubmitting, runStep } = useSetupStep();

const usernameRef = ref<Validatable | null>(null);
const emailRef = ref<Validatable | null>(null);
const passwordRef = ref<Validatable | null>(null);
const confirmPasswordRef = ref<Validatable | null>(null);

const form = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});

// 基础正则规则
const patterns = {
  // 用户名：3-50位
  username: /^.{3,50}$/,
  // 邮箱：标准邮箱格式
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // 密码：6-50位
  password: /^.{6,50}$/,
};

const handleNext = () => {
  // 手动校验密码一致性
  if (form.password !== form.confirmPassword) {
    useToast.error(t("views.setup.steps.step3.passwordMismatch"));
    return;
  }

  runStep(
    async () => {
      // 1. 注册管理员账号
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
      });

      // 2. 注册成功后立即登录，以获取后续操作所需的 Cookie/Token
      await login({
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
      :label="t('views.setup.steps.step3.username')"
      :placeholder="t('views.setup.steps.step3.usernamePlaceholder')"
      :pattern="patterns.username"
      :error-message="t('views.setup.steps.step3.usernameError')"
      required
    />

    <!-- 邮箱 -->
    <TipInput
      ref="emailRef"
      v-model="form.email"
      type="email"
      :label="t('views.setup.steps.step3.email')"
      :placeholder="t('views.setup.steps.step3.emailPlaceholder')"
      :pattern="patterns.email"
      :error-message="t('views.setup.steps.step3.emailError')"
      required
    />

    <!-- 密码 -->
    <TipInput
      ref="passwordRef"
      v-model="form.password"
      type="password"
      :label="t('views.setup.steps.step3.password')"
      :placeholder="t('views.setup.steps.step3.passwordPlaceholder')"
      :pattern="patterns.password"
      :error-message="t('views.setup.steps.step3.passwordError')"
      required
    />

    <!-- 确认密码 -->
    <TipInput
      ref="confirmPasswordRef"
      v-model="form.confirmPassword"
      type="password"
      :label="t('views.setup.steps.step3.confirmPassword')"
      :placeholder="t('views.setup.steps.step3.confirmPasswordPlaceholder')"
      required
    />
  </StepLayout>
</template>
