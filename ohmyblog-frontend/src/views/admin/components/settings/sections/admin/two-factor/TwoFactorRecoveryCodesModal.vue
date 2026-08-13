<!-- src/views/admin/components/settings/sections/admin/TwoFactorRecoveryCodesModal.vue -->
<!--
  两步验证 - 重新生成恢复码（两步）

  step 1  提交一次当前验证码
  step 2  展示新恢复码

  为什么要验一次验证码：只凭「已登录」就能换掉恢复码的话，会话被劫持后
  攻击者可以悄悄给自己留一份长期有效的后门凭证。
-->
<script setup lang="ts">
import { ref, watch } from "vue";
import { KeyRound } from "lucide-vue-next";
import BaseModal from "@/components/base/pop/BaseModal.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import RecoveryCodesPanel from "./RecoveryCodesPanel.vue";
import { TwoFactorTokenDTO } from "@server/dtos/two-factor.dto";
import { TOTP_DIGITS } from "@/api/shared";
import { regenerateRecoveryCodes } from "@/api/two-factor.api";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import type { Validatable } from "@/composables/setup-step.hook";

const props = defineProps<{
  /** 弹窗显示状态（支持 v-model） */
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  /** 生成成功，通知父组件刷新剩余数量 */
  regenerated: [];
}>();

const { t } = useLang();

const step = ref<1 | 2>(1);
const isSubmitting = ref(false);

const token = ref("");
const tokenRef = ref<Validatable | null>(null);

const recoveryCodes = ref<string[]>([]);
const recoveryCodesRef = ref<InstanceType<typeof RecoveryCodesPanel> | null>(null);

const reset = () => {
  step.value = 1;
  token.value = "";
  recoveryCodes.value = [];
};

watch(
  () => props.modelValue,
  () => reset(),
);

const handleRegenerate = async () => {
  if (!tokenRef.value?.validate()) return;

  isSubmitting.value = true;
  try {
    const res = await regenerateRecoveryCodes({ token: token.value });
    recoveryCodes.value = res?.recoveryCodes ?? [];
    step.value = 2;
    emit("regenerated");
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
    token.value = "";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    max-width="max-w-lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <KeyRound class="w-5 h-5 text-accent" />
        <h2 class="text-xl font-bold text-fg">
          {{ t("views.admin.Settings.admin.twoFactor.regenerate.title") }}
        </h2>
      </div>
    </template>

    <!-- step 1：验证码确认 -->
    <div v-if="step === 1" class="flex flex-col gap-5">
      <p class="text-fg text-sm">
        {{ t("views.admin.Settings.admin.twoFactor.regenerate.description") }}
      </p>

      <form @submit.prevent="handleRegenerate">
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

    <!-- step 2：新恢复码 -->
    <div v-else class="flex flex-col gap-5">
      <p class="text-fg text-sm">
        {{ t("views.admin.Settings.admin.twoFactor.regenerate.doneHint") }}
      </p>
      <RecoveryCodesPanel ref="recoveryCodesRef" :codes="recoveryCodes" />
    </div>

    <template #footer>
      <template v-if="step === 1">
        <ButtonSecondary
          :text="t('common.cancel')"
          class="min-w-24 py-2"
          @click="emit('update:modelValue', false)"
        />
        <ButtonPrimary
          :text="t('views.admin.Settings.admin.twoFactor.regenerate.submit')"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          class="min-w-24 py-2"
          @click="handleRegenerate"
        />
      </template>

      <!-- step 2：下载为文件 + 完成 -->
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
