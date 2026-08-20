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
import {
  RECAPTCHA_DEFAULT_MIN_SCORE,
  type TCaptchaProvider,
} from "@/api/shared";
import { useCaptcha } from "@/composables/captcha.hook";
import { useConfigForm } from "@/composables/config-form.hook";

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

/** 表单整体形状：比 DTO 多了「必填」的credentials/scenes（DTO 里两者可选），
 *  两张卡片直接按这个形状编辑，不会遇到 undefined */
type CaptchaForm = {
  enabled: boolean;
  provider: TCaptchaProvider;
  credentials: Record<TCaptchaProvider, Credential>;
  recaptchaMinScore: number;
  scenes: { login: boolean; forgotPassword: boolean; friendApply: boolean };
};

// 读写机制由 useConfigForm 收敛；嵌套密钥的逐字段兜底（存量的 credentials
// 可能只配过其中一家）浅合并拿不准，用 merge 接管归一化
const { formData, isLoaded, load, save } = useConfigForm<CaptchaForm>(
  "captcha",
  {
    enabled: false,
    provider: "turnstile",
    credentials: emptyCredentials(),
    recaptchaMinScore: RECAPTCHA_DEFAULT_MIN_SCORE,
    scenes: { login: false, forgotPassword: false, friendApply: false },
  },
  {
    merge: (loaded, defaults) => ({
      enabled: Boolean(loaded.enabled),
      provider: loaded.provider ?? defaults.provider,
      credentials: { ...defaults.credentials, ...loaded.credentials },
      recaptchaMinScore: loaded.recaptchaMinScore ?? defaults.recaptchaMinScore,
      scenes: { ...defaults.scenes, ...loaded.scenes },
    }),
  },
);

// ── 保存 ────────────────────────────────────────────────────────────────
// 两张卡片的保存按钮写的是同一份整体配置（后端只有一个 captcha key），
// payload 无差别，差别只在按钮各自的 loading 和保存后的联动

const isConfigSaving = ref(false);
const isScenesSaving = ref(false);

/** 保存配置卡片（开关 + 服务商 + 密钥） */
const handleSaveConfig = async () => {
  isConfigSaving.value = true;
  try {
    // 配置卡片影响前台验证框的加载，保存成功后刷新公开配置缓存
    if (await save()) await refreshPublicConfig();
  } finally {
    isConfigSaving.value = false;
  }
};

/** 保存入口卡片（哪些场景需要验证码） */
const handleSaveScenes = async () => {
  isScenesSaving.value = true;
  try {
    await save();
  } finally {
    isScenesSaving.value = false;
  }
};

onMounted(load);
</script>

<template>
  <div class="flex flex-col gap-8">
    <CaptchaConfigCard
      :form="formData"
      :is-loaded="isLoaded"
      :is-saving="isConfigSaving"
      @save="handleSaveConfig"
    />

    <CaptchaEntriesCard
      v-if="formData.enabled && isLoaded"
      :scenes="formData.scenes"
      :is-loaded="isLoaded"
      :is-saving="isScenesSaving"
      @save="handleSaveScenes"
      @scene-focus="emit('scene-focus', $event)"
    />
  </div>
</template>
