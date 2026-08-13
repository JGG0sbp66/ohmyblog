<!-- src/views/admin/pages/auth/Login.page.vue -->
<!--
  登录页面
  - 账号密码始终可见
  - 开启两步验证后，点击登录会在密码框下方展开验证码输入框
  - 验证码/恢复码共用一个输入框，后端按格式自动分派
-->
<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import AuthLayout from "@/views/admin/components/layout/AuthLayout.vue";
import AuthCard from "@/components/base/card/AuthCard.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ButtonThird from "@/components/base/button/ButtonThird.vue";
import { RiArrowLeftLine } from "@remixicon/vue";
import { useAuthStore } from "@/stores/auth.store";
import { login } from "@/api/auth.api";
import { verifyTwoFactor } from "@/api/two-factor.api";
import {
  TWO_FACTOR_CHALLENGE_EXPIRED_MESSAGE,
  TWO_FACTOR_EXHAUSTED_MESSAGE,
} from "@/api/shared";
import { LoginDTO } from "@server/dtos/auth.dto";
import { TwoFactorVerifyDTO } from "@server/dtos/two-factor.dto";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";

type TipInputInstance = InstanceType<typeof TipInput>;

const router = useRouter();
const authStore = useAuthStore();
const { t } = useLang();

// 表单容器：auto-animate 自动处理子元素增减动画
const [formRef] = useAutoAnimate();

// 表单数据
const form = ref({
  identifier: "",
  password: "",
  twoFactorCode: "",
});

// 是否需要两步验证（密码通过后展开）
const needsTwoFactor = ref(false);

// 表单引用
const identifierRef = useTemplateRef<TipInputInstance>("identifierRef");
const passwordRef = useTemplateRef<TipInputInstance>("passwordRef");
const codeRef = useTemplateRef<TipInputInstance>("codeRef");

// 状态
const isSubmitting = ref(false);

/** 登录收尾：同步用户信息并进入后台 */
const finishLogin = async () => {
  await authStore.fetchMe();
  router.push({ name: "dashboard" });
};

/** 统一提交：根据当前状态决定调登录接口还是验证接口 */
const handleSubmit = async () => {
  // 始终校验账号密码
  const identifierValid = identifierRef.value?.validate();
  const passwordValid = passwordRef.value?.validate();
  if (!identifierValid || !passwordValid) return;

  // 如果已展开验证码输入框，同时校验验证码
  if (needsTwoFactor.value) {
    const codeValid = codeRef.value?.validate();
    if (!codeValid) return;
  }

  isSubmitting.value = true;

  try {
    if (needsTwoFactor.value) {
      // 第二步：提交验证码
      await verifyTwoFactor({ code: form.value.twoFactorCode });
      await finishLogin();
    } else {
      // 第一步：提交账号密码
      const res = await login({
        identifier: form.value.identifier,
        password: form.value.password,
      });

      if (res?.requiresTwoFactor) {
        // 展开验证码输入框
        needsTwoFactor.value = true;
        form.value.twoFactorCode = "";
      } else {
        await finishLogin();
      }
    }
  } catch (error: any) {
    useToast.error(
      needsTwoFactor.value
        ? t(`api.errors.${error}`)
        : error || t("api.errors.未登录或会话已过期"),
    );

    // 验证码错误时清空输入，方便重试
    if (needsTwoFactor.value) {
      form.value.twoFactorCode = "";

      // 次数用尽或 challenge 过期：后端已作废凭证，收起验证码框回到初始状态。
      // 不收起的话用户会留在第二步反复失败，永远等不到成功
      if (
        error === TWO_FACTOR_EXHAUSTED_MESSAGE ||
        error === TWO_FACTOR_CHALLENGE_EXPIRED_MESSAGE
      ) {
        needsTwoFactor.value = false;
      }
    }
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
    <AuthCard
      :title="t('views.login.title')"
      :description="t('views.login.description')"
    >
      <!-- 表单 -->
      <form ref="formRef" @submit.prevent="handleSubmit" class="flex flex-col gap-6">
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

        <!-- 两步验证码（auto-animate 自动处理展开/收起动画） -->
        <div v-if="needsTwoFactor">
          <TipInput
            ref="codeRef"
            v-model="form.twoFactorCode"
            :label="t('views.login.twoFactor.code.label')"
            :placeholder="t('views.login.twoFactor.code.placeholder')"
            :hint="t('views.login.twoFactor.code.hint')"
            :schema="TwoFactorVerifyDTO.properties.code"
            autocomplete="one-time-code"
            required
          />
        </div>

        <!-- 忘记密码 -->
        <div
          class="-mt-3 flex justify-end text-xs onload-animation anim-delay-100"
        >
          <ButtonThird
            :text="t('views.login.forgotPassword')"
            :to="{ name: 'forgot-password' }"
          />
        </div>

        <!-- 登录按钮 -->
        <div class="pt-4 onload-animation anim-delay-150">
          <ButtonPrimary
            :text="
              needsTwoFactor
                ? t('views.login.twoFactor.submit')
                : t('views.login.submit')
            "
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
            <RiArrowLeftLine class="w-5 h-5" />
          </ButtonSecondary>
        </div>
      </form>
    </AuthCard>
  </AuthLayout>
</template>
