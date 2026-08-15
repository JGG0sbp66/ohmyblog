<!-- src/views/admin/components/security/CaptchaSettingsForm.vue -->
<!--
  人机验证设置容器。

  组合两张卡片（配置 + 入口），各自带保存按钮，独立保存。
  只有开启验证码时才显示入口卡片。
  对外暴露 sceneFocus 事件，供父级联动预览 tab 切换。
-->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import CaptchaConfigCard from "./CaptchaConfigCard.vue";
import CaptchaEntriesCard from "./CaptchaEntriesCard.vue";
import { getConfig, upsertConfig } from "@/api/config.api";
import {
  RECAPTCHA_DEFAULT_MIN_SCORE,
  type TCaptchaProvider,
} from "@/api/shared";
import { useCaptcha } from "@/composables/captcha.hook";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";

const { t } = useLang();
const { refresh: refreshPublicConfig } = useCaptcha();

const emit = defineEmits<{
  "scene-focus": [index: number];
}>();

type Credential = { siteKey: string; secretKey: string };

const emptyCredentials = (): Record<TCaptchaProvider, Credential> => ({
  turnstile: { siteKey: "", secretKey: "" },
  hcaptcha: { siteKey: "", secretKey: "" },
  recaptcha: { siteKey: "", secretKey: "" },
});

const configForm = ref({
  enabled: false,
  provider: "turnstile" as TCaptchaProvider,
  credentials: emptyCredentials(),
  recaptchaMinScore: RECAPTCHA_DEFAULT_MIN_SCORE,
});

const scenesForm = ref({
  login: false,
  forgotPassword: false,
  friendApply: false,
});

const isConfigSaving = ref(false);
const isScenesSaving = ref(false);
const isLoaded = ref(false);

// ── 读写配置 ────────────────────────────────────────────────────────────

const loadConfig = async () => {
  try {
    const res = await getConfig("captcha");
    const value = res?.config?.configValue as any | undefined;
    if (!value) return;

    configForm.value = {
      enabled: Boolean(value.enabled),
      provider: value.provider ?? "turnstile",
      credentials: { ...emptyCredentials(), ...value.credentials },
      recaptchaMinScore: value.recaptchaMinScore ?? RECAPTCHA_DEFAULT_MIN_SCORE,
    };

    scenesForm.value = {
      login: false,
      forgotPassword: false,
      friendApply: false,
      ...value.scenes,
    };
  } catch {
    // 404 = 还没配置过，用默认值即可
  } finally {
    isLoaded.value = true;
  }
};

/** 保存配置卡片（开关 + 服务商 + 密钥） */
const handleSaveConfig = async () => {
  isConfigSaving.value = true;
  try {
    await upsertConfig({
      configKey: "captcha",
      configValue: {
        enabled: configForm.value.enabled,
        provider: configForm.value.provider,
        credentials: configForm.value.credentials,
        recaptchaMinScore: configForm.value.recaptchaMinScore,
        scenes: scenesForm.value,
      },
      isPublic: false,
    });
    useToast.success(t("api.success.保存成功"));
    await refreshPublicConfig();
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isConfigSaving.value = false;
  }
};

/** 保存入口卡片（哪些场景需要验证码） */
const handleSaveScenes = async () => {
  isScenesSaving.value = true;
  try {
    await upsertConfig({
      configKey: "captcha",
      configValue: {
        enabled: configForm.value.enabled,
        provider: configForm.value.provider,
        credentials: configForm.value.credentials,
        recaptchaMinScore: configForm.value.recaptchaMinScore,
        scenes: scenesForm.value,
      },
      isPublic: false,
    });
    useToast.success(t("api.success.保存成功"));
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isScenesSaving.value = false;
  }
};

onMounted(loadConfig);
</script>

<template>
  <div class="flex flex-col gap-8">
    <CaptchaConfigCard
      v-model:form="configForm"
      :is-loaded="isLoaded"
      :is-saving="isConfigSaving"
      @save="handleSaveConfig"
    />

    <CaptchaEntriesCard
      v-if="configForm.enabled && isLoaded"
      v-model:scenes="scenesForm"
      :is-loaded="isLoaded"
      :is-saving="isScenesSaving"
      @save="handleSaveScenes"
      @scene-focus="emit('scene-focus', $event)"
    />
  </div>
</template>
