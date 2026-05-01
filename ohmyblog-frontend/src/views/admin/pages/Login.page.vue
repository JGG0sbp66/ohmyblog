<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthLayout from "@/views/admin/components/layout/AuthLayout.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ButtonThird from "@/components/base/button/ButtonThird.vue";
import ArrowLeft from "@/components/icon/ui/ArrowLeft.vue";
import { useAuthStore } from "@/stores/auth.store";
import { login } from "@/api/auth.api";
import { LoginDTO } from "@server/dtos/auth.dto";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import type { Validatable } from "@/composables/setup-step.hook";

const router = useRouter();
const authStore = useAuthStore();
const { t } = useLang();

// 表单数据
const form = ref({
  identifier: "",
  password: "",
});

// 表单引用
const identifierRef = ref<Validatable | null>(null);
const passwordRef = ref<Validatable | null>(null);

// 状态
const isSubmitting = ref(false);

// 登录处理
const handleLogin = async () => {
  // 验证表单
  const identifierValid = identifierRef.value?.validate();
  const passwordValid = passwordRef.value?.validate();

  if (!identifierValid || !passwordValid) {
    return;
  }

  isSubmitting.value = true;

  try {
    // 调用登录 API
    await login({
      identifier: form.value.identifier,
      password: form.value.password,
    });

    // 更新 authStore
    await authStore.fetchMe();

    // 跳转到管理后台
    router.push({ name: "dashboard" });
  } catch (error: any) {
    // 使用 toast 显示错误信息
    useToast.error(error || t("api.errors.未登录或会话已过期"));
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AuthLayout
    :brand-line1="t('views.login.brand.line1')"
    :brand-line2="t('views.login.brand.line2')"
    :brand-line3="t('views.login.brand.line3')"
  >
    <div class="flex flex-col gap-6">
      <!-- 标题 -->
      <div class="flex flex-col gap-2 onload-animation">
        <h1 class="text-2xl font-bold text-fg">
          {{ t("views.login.title") }}
        </h1>
        <p class="text-fg-subtle text-sm">
          {{ t("views.login.description") }}
        </p>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="handleLogin" class="flex flex-col gap-6">
        <!-- 用户名/邮箱 -->
        <div class="onload-animation anim-delay-50">
          <TipInput
            ref="identifierRef"
            v-model="form.identifier"
            :label="t('views.login.identifier.label')"
            :placeholder="t('views.login.identifier.placeholder')"
            :schema="LoginDTO.properties.identifier"
            required
          />
        </div>

        <!-- 密码 -->
        <div class="onload-animation anim-delay-100">
          <TipInput
            ref="passwordRef"
            v-model="form.password"
            type="password"
            :label="t('views.login.password.label')"
            :placeholder="t('views.login.password.placeholder')"
            :schema="LoginDTO.properties.password"
            required
          />
        </div>

        <!-- 忘记密码 -->
        <div
          class="-mt-3 flex justify-end text-xs onload-animation anim-delay-100"
        >
          <ButtonThird
            :text="t('views.login.forgotPassword')"
            @click="router.push({ name: 'forgot-password' })"
          />
        </div>

        <!-- 登录按钮 -->
        <div class="pt-4 onload-animation anim-delay-150">
          <ButtonPrimary
            :text="t('views.login.submit')"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            class="w-full py-2"
          />
        </div>

        <!-- 分割线 -->
        <div class="border-t border-fg-muted/15"></div>

        <!-- 返回首页按钮 -->
        <div class="onload-animation anim-delay-150">
          <ButtonSecondary
            :text="t('views.login.backToHome')"
            @click="router.push({ name: 'home' })"
            class="w-full px-4! py-2!"
          >
            <ArrowLeft />
          </ButtonSecondary>
        </div>
      </form>
    </div>
  </AuthLayout>
</template>
