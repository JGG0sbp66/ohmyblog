<!-- src/views/admin/components/security/CaptchaSettingsForm.vue -->
<!--
  人机验证设置容器。

  组合两张卡片（配置 + 入口），各自带保存按钮，独立保存。
  只有开启验证码时才显示入口卡片。
  对外暴露 sceneFocus 事件，供父级联动预览 tab 切换。
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import CaptchaConfigCard from "./CaptchaConfigCard.vue";
import CaptchaEntriesCard from "./CaptchaEntriesCard.vue";
import {
  RECAPTCHA_DEFAULT_MIN_SCORE,
  type TCaptchaProvider,
} from "@/api/shared";
import {
  DISABLED_CAPTCHA_CONFIG,
  useCaptcha,
  type CaptchaPublicConfig,
} from "@/composables/captcha.hook";
import { useConfigForm } from "@/composables/config-form.hook";

const { notifyChanged, publishPreview } = useCaptcha();

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
    // 配置卡片影响前台验证框的加载，保存成功后本地刷新并广播给预览 iframe
    if (await save()) await notifyChanged();
  } finally {
    isConfigSaving.value = false;
  }
};

/** 保存入口卡片（哪些场景需要验证码） */
const handleSaveScenes = async () => {
  isScenesSaving.value = true;
  try {
    // 场景开关直接影响预览页该不该渲染验证框，同样需要保存后广播刷新
    if (await save()) await notifyChanged();
  } finally {
    isScenesSaving.value = false;
  }
};

// ── 未保存状态的实时预览 ──────────────────────────────────────
// 预览 iframe 读的是后端配置，未保存的东西它看不到；不等保存就要让预览
// 先变，只能把表单当前值推成公开配置的形状直接广播过去

/**
 * 由未保存的表单数据推导公开配置形状，判定与后端 getActive/getPublicConfig
 * 逐条对齐：总开关开着且当前服务商两把 key 都不为空才算生效；不生效时
 * provider/siteKey 置 null、场景一律 false。secretKey 只参与判定不进
 * 消息体，同源的频道也不值得冒险
 */
const derivePreviewConfig = (): CaptchaPublicConfig => {
  const form = formData.value;
  const credential = form.credentials[form.provider];
  const active =
    form.enabled &&
    Boolean(credential.siteKey) &&
    Boolean(credential.secretKey);

  if (!active) return DISABLED_CAPTCHA_CONFIG;
  return {
    enabled: true,
    provider: form.provider,
    siteKey: credential.siteKey,
    scenes: { ...form.scenes },
  };
};

// 开关、密钥、服务商任一变动都即时广播，预览先于保存生效；确认无误再点
// 保存走 notifyChanged 切回后端数据。isLoaded 拦住加载完成前的默认值，
// 免得拿一份全 false 的假状态把真配置冲掉
watch(
  formData,
  () => {
    if (isLoaded.value) publishPreview(derivePreviewConfig());
  },
  { deep: true },
);

// 离开设置页时清理：没保存的幽灵状态不该留在别的窗口里，广播 clear
// 让各方退回后端配置
onBeforeUnmount(() => publishPreview(null));

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
