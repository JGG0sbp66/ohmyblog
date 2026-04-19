<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import TypingBrand from "@/components/icon/TypingBrand.vue";
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
  <div class="min-h-screen flex flex-col bg-bg">
    <main class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-5xl flex items-center justify-center gap-12">
        <!-- 左侧：品牌展示 -->
        <div class="hidden lg:block w-full animate-fade-in">
          <TypingBrand
            :line1="t('views.login.brand.line1')"
            :line2="t('views.login.brand.line2')"
            :line3="t('views.login.brand.line3')"
          />
        </div>

        <!-- 右侧：登录表单 -->
        <div
          class="w-full max-w-md bg-bg-card rounded-3xl shadow-xl p-8 animate-fade-in animate-delay-100"
        >
          <div class="flex flex-col gap-6">
            <!-- 标题 -->
            <div class="flex flex-col gap-2">
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
              <TipInput
                ref="identifierRef"
                v-model="form.identifier"
                :label="t('views.login.identifier.label')"
                :placeholder="t('views.login.identifier.placeholder')"
                :schema="LoginDTO.properties.identifier"
                required
              />

              <!-- 密码 -->
              <TipInput
                ref="passwordRef"
                v-model="form.password"
                type="password"
                :label="t('views.login.password.label')"
                :placeholder="t('views.login.password.placeholder')"
                :schema="LoginDTO.properties.password"
                required
              />

              <!-- 登录按钮 -->
              <div class="flex justify-end pt-4 gap-48">
                <div class="flex-1"></div>
                <ButtonPrimary
                  :text="t('views.login.submit')"
                  :loading="isSubmitting"
                  :disabled="isSubmitting"
                  class="flex-1 py-2"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
