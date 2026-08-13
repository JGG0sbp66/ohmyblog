<!-- src/views/admin/components/settings/sections/admin/TwoFactorSetupModal.vue -->
<!--
  两步验证 - 三步启用向导

  step 1  扫码 / 手动录入密钥
  step 2  提交一次验证码确认（**通过后才落库启用**，避免用户抄错密钥把自己锁在门外）
  step 3  一次性展示恢复码，必须确认已保存才能关闭

  整个流程放弹窗而不是内联在卡片里：三步的内容高度差异很大，BaseModal 的
  ResizeObserver 会把高度变化过渡掉；而且恢复码那一步需要占满视野，
  塞在卡片角落用户会直接划过去。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import QRCode from "qrcode";
import { ShieldCheck } from "lucide-vue-next";
import BaseModal from "@/components/base/pop/BaseModal.vue";
import BaseProgress from "@/components/base/progress/BaseProgress.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import Loading from "@/components/common/item/Loading.vue";
import RecoveryCodesPanel from "./RecoveryCodesPanel.vue";
import { TwoFactorTokenDTO } from "@server/dtos/two-factor.dto";
import { TOTP_DIGITS } from "@/api/shared";
import { enableTwoFactor, startTwoFactorSetup } from "@/api/two-factor.api";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import type { Validatable } from "@/composables/setup-step.hook";

const props = defineProps<{
  /** 弹窗显示状态（支持 v-model） */
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  /** 启用成功，通知父组件刷新状态 */
  enabled: [];
}>();

const { t } = useLang();

const step = ref<1 | 2 | 3>(1);
const isLoading = ref(false);
const isSubmitting = ref(false);

// step 1
const secret = ref("");
const qrDataUrl = ref("");

// step 2
const token = ref("");
const tokenRef = ref<Validatable | null>(null);

// step 3
const recoveryCodes = ref<string[]>([]);
const recoveryCodesRef = ref<InstanceType<typeof RecoveryCodesPanel> | null>(null);

/** 密钥按 4 字符分组，手动录入时不容易看串行 */
const groupedSecret = computed(
  () => secret.value.match(/.{1,4}/g)?.join(" ") ?? "",
);

/** 重置所有状态，回到第一步 */
const reset = () => {
  step.value = 1;
  secret.value = "";
  qrDataUrl.value = "";
  token.value = "";
  recoveryCodes.value = [];
};

/** 请求新密钥并渲染二维码 */
const loadSetup = async () => {
  isLoading.value = true;
  try {
    // unwrap 的返回类型带 null（Eden 的保守推导），失败时它已经 throw 了，
    // 这里按项目既有写法走可选链兜底；secret 为空时「下一步」本身是禁用的
    const res = await startTwoFactorSetup();
    secret.value = res?.secret ?? "";
    // 二维码固定深前景 + 白底：站点主题色可能是低对比度的，
    // 而验证器 App 的识别对对比度很敏感
    qrDataUrl.value = res?.uri
      ? await QRCode.toDataURL(res.uri, {
          width: 320,
          margin: 1,
          color: { dark: "#18181b", light: "#ffffff" },
        })
      : "";
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
    emit("update:modelValue", false);
  } finally {
    isLoading.value = false;
  }
};

// 打开时拉密钥；关闭时清空（密钥和恢复码都不在内存里多留）
watch(
  () => props.modelValue,
  (open) => {
    reset();
    if (open) void loadSetup();
  },
);

/** step 2 → step 3：校验验证码并启用 */
const handleEnable = async () => {
  if (!tokenRef.value?.validate()) return;

  isSubmitting.value = true;
  try {
    const res = await enableTwoFactor({ token: token.value });
    recoveryCodes.value = res?.recoveryCodes ?? [];
    step.value = 3;
    // 此刻后端已经启用了，先通知父组件刷新状态，
    // 不等用户勾完「已保存」—— 否则中途刷新页面卡片会显示成未启用
    emit("enabled");
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
    token.value = "";
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * BaseModal 的关闭请求。
 */
const handleCloseRequest = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    max-width="max-w-lg"
    @update:model-value="handleCloseRequest"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <ShieldCheck class="w-5 h-5 text-accent" />
        <h2 class="text-xl font-bold text-fg">
          {{ t("views.admin.Settings.admin.twoFactor.title") }}
        </h2>
      </div>
      <BaseProgress
        :current-step="step"
        :total-steps="3"
        :title="t(`views.admin.Settings.admin.twoFactor.setup.step${step}.title`)"
        class="mt-3"
      />
    </template>

    <!-- 拉取密钥中 -->
    <div v-if="isLoading" class="flex justify-center py-10">
      <Loading />
    </div>

    <!-- step 1：扫码 -->
    <div v-else-if="step === 1" class="flex flex-col gap-5">
      <p class="text-fg text-sm">
        {{ t("views.admin.Settings.admin.twoFactor.setup.step1.description") }}
      </p>

      <div class="flex justify-center">
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          :alt="t('views.admin.Settings.admin.twoFactor.setup.step1.qrAlt')"
          class="w-44 h-44 rounded-xl bg-white p-2 shadow-sm"
        />
      </div>

      <!-- 手动录入用的密钥 -->
      <TipInput
        :model-value="groupedSecret"
        :label="t('views.admin.Settings.admin.twoFactor.setup.step1.manualLabel')"
        :hint="t('views.admin.Settings.admin.twoFactor.setup.step1.manualHint')"
        readonly
      />
    </div>

    <!-- step 2：确认验证码 -->
    <div v-else-if="step === 2" class="flex flex-col gap-5">
      <p class="text-fg text-sm">
        {{ t("views.admin.Settings.admin.twoFactor.setup.step2.description") }}
      </p>

      <form @submit.prevent="handleEnable">
        <TipInput
          ref="tokenRef"
          v-model="token"
          :label="t('views.admin.Settings.admin.twoFactor.setup.step2.label')"
          :placeholder="'0'.repeat(TOTP_DIGITS)"
          :hint="t('views.admin.Settings.admin.twoFactor.setup.step2.hint')"
          :schema="TwoFactorTokenDTO.properties.token"
          autocomplete="one-time-code"
          required
        />
      </form>
    </div>

    <!-- step 3：恢复码 -->
    <div v-else class="flex flex-col gap-5">
      <p class="text-fg text-sm">
        {{ t("views.admin.Settings.admin.twoFactor.setup.step3.description") }}
      </p>
      <RecoveryCodesPanel ref="recoveryCodesRef" :codes="recoveryCodes" />
    </div>

    <template #footer>
      <!-- step 1 -->
      <template v-if="step === 1">
        <ButtonSecondary
          :text="t('common.cancel')"
          class="min-w-24 py-2"
          @click="emit('update:modelValue', false)"
        />
        <ButtonPrimary
          :text="t('common.next')"
          :disabled="isLoading || !secret"
          class="min-w-24 py-2"
          @click="step = 2"
        />
      </template>

      <!-- step 2 -->
      <template v-else-if="step === 2">
        <ButtonSecondary
          :text="t('common.prev')"
          class="min-w-24 py-2"
          @click="step = 1"
        />
        <ButtonPrimary
          :text="t('views.admin.Settings.admin.twoFactor.setup.step2.submit')"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          class="min-w-24 py-2"
          @click="handleEnable"
        />
      </template>

      <!-- step 3：下载为文件 + 完成 -->
      <template v-else>
        <ButtonSecondary
          :text="t('views.admin.Settings.admin.twoFactor.codes.download')"
          class="min-w-24 py-2"
          @click="recoveryCodesRef?.handleDownload()"
        />
        <ButtonPrimary
          :text="t('common.finish')"
          class="min-w-24 py-2"
          @click="emit('update:modelValue', false)"
        />
      </template>
    </template>
  </BaseModal>
</template>
