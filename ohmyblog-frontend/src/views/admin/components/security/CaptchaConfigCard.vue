<!-- src/views/admin/components/security/CaptchaConfigCard.vue -->
<!--
  人机验证配置卡片。

  包含：总开关、测试台、服务商选择、密钥填写、reCAPTCHA 分数线。
  测试台在服务商上面（密钥填好后出现），让管理员先确认密钥可用再继续配置。
-->
<script setup lang="ts">
import { computed } from "vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import SegmentedControl from "@/components/base/control/SegmentedControl.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import FieldLabel from "@/components/base/input/FieldLabel.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ModuleItem from "@/components/common/item/ModuleItem.vue";
import CaptchaTestPanel from "./CaptchaTestPanel.vue";
import TurnstileIcon from "@/components/common/captcha/icons/TurnstileIcon.vue";
import HCaptchaIcon from "@/components/common/captcha/icons/HCaptchaIcon.vue";
import ReCaptchaIcon from "@/components/common/captcha/icons/ReCaptchaIcon.vue";
import {
  CAPTCHA_PROVIDERS,
  RECAPTCHA_DEFAULT_MIN_SCORE,
  type TCaptchaProvider,
} from "@/api/shared";
import { CaptchaConfigUpsertDTO } from "@server/dtos/config.dto";
import { useLang } from "@/composables/lang.hook";

type Credential = { siteKey: string; secretKey: string };

export interface CaptchaConfigForm {
  enabled: boolean;
  provider: TCaptchaProvider;
  credentials: Record<TCaptchaProvider, Credential>;
  recaptchaMinScore: number;
}

/**
 * 表单对象由父级（CaptchaSettingsForm 的 useConfigForm）持有，
 * 本卡片只就地编辑嵌套字段、从不整对象替换，所以是 prop 而非 v-model
 */
const props = defineProps<{
  form: CaptchaConfigForm;
  isLoaded: boolean;
  isSaving: boolean;
}>();

const emit = defineEmits<{
  save: [];
}>();

const { t } = useLang();
const [formRef] = useAutoAnimate();

/** 当前选中那家的密钥 */
const current = computed(() => props.form.credentials[props.form.provider]);

/** reCAPTCHA v3 才有分数线 */
const isScoreProvider = computed(
  () => props.form.provider === "recaptcha",
);

/**
 * 服务商对应的官方品牌图标（SVG 数据取自 Iconify 的 logos 集，见各组件内注释）。
 *
 * iconClass 按各家的 viewBox 宽高比做视觉配平：hCaptcha / reCAPTCHA 近正方形，
 * 默认 h-3.5（14×14）正好；Cloudflare 云标是 256:117 的宽扁形，同高会撑到
 * ~31px 宽、显得明显偏大，故单独压到 h-2.5（≈10×22），三者视觉面积大致相当。
 */
const providerIconMeta: Record<
  TCaptchaProvider,
  { icon: typeof TurnstileIcon; iconClass?: string }
> = {
  turnstile: { icon: TurnstileIcon, iconClass: "h-2.5 w-auto" },
  hcaptcha: { icon: HCaptchaIcon },
  recaptcha: { icon: ReCaptchaIcon },
};

const providerOptions = computed(() =>
  CAPTCHA_PROVIDERS.map((value) => ({
    value,
    label: t(`views.admin.Security.providers.${value}`),
    ...providerIconMeta[value],
  })),
);

/** 两把 key 都填了才谈得上测试 */
const canTest = computed(
  () =>
    current.value.siteKey.trim() !== "" &&
    current.value.secretKey.trim() !== "",
);

const schema = CaptchaConfigUpsertDTO.properties.configValue.properties;
</script>

<template>
  <SettingCard
    :title="t('views.admin.Security.title')"
    :description="t('views.admin.Security.description')"
  >
    <div ref="formRef" class="flex flex-col gap-8">
      <ModuleItem
        v-model="form.enabled"
        :loading="!isLoaded"
        :title="t('views.admin.Security.toggle.title')"
        :description="t('views.admin.Security.toggle.description')"
      />

      <template v-if="isLoaded && form.enabled">
        <!-- 测试台（密钥填好后出现，位于服务商选择上面） -->
        <CaptchaTestPanel
          v-if="canTest"
          :provider="form.provider"
          :site-key="current.siteKey.trim()"
          :secret-key="current.secretKey.trim()"
          :min-score="isScoreProvider ? form.recaptchaMinScore : undefined"
        />

        <!-- 服务商 -->
        <div class="flex flex-col gap-3">
          <FieldLabel
            :label="t('views.admin.Security.provider.label')"
            :tooltip="t('views.admin.Security.provider.hint')"
            class="px-1"
          />
          <SegmentedControl
            v-model="form.provider"
            :options="providerOptions"
          />
        </div>

        <!-- 当前服务商的两把密钥 -->
        <div class="flex flex-col gap-4">
          <TipInput
            v-model="current.siteKey"
            :label="t('views.admin.Security.siteKey.label')"
            :placeholder="t('views.admin.Security.siteKey.placeholder')"
            :hint="t('views.admin.Security.siteKey.hint')"
            :schema="schema.credentials.properties.turnstile.properties.siteKey"
          />
          <TipInput
            v-model="current.secretKey"
            type="password"
            autocomplete="off"
            :label="t('views.admin.Security.secretKey.label')"
            :placeholder="t('views.admin.Security.secretKey.placeholder')"
            :hint="t('views.admin.Security.secretKey.hint')"
            :schema="
              schema.credentials.properties.turnstile.properties.secretKey
            "
          />

          <!-- 只有 reCAPTCHA v3 有分数概念 -->
          <TipInput
            v-if="isScoreProvider"
            v-model.number="form.recaptchaMinScore"
            type="number"
            :label="t('views.admin.Security.minScore.label')"
            :placeholder="String(RECAPTCHA_DEFAULT_MIN_SCORE)"
            :hint="t('views.admin.Security.minScore.hint')"
            :schema="schema.recaptchaMinScore"
          />
        </div>

        <!-- 保存按钮 -->
        <div class="flex justify-end pt-4">
          <ButtonPrimary
            :text="t('common.save')"
            :loading="isSaving"
            class="w-full sm:w-auto px-8"
            @click="emit('save')"
          />
        </div>
      </template>

      <!-- 未开启时的保存按钮（仅保存开关状态） -->
      <div v-if="isLoaded && !form.enabled" class="flex justify-end pt-4">
        <ButtonPrimary
          :text="t('common.save')"
          :loading="isSaving"
          class="w-full sm:w-auto px-8"
          @click="emit('save')"
        />
      </div>
    </div>
  </SettingCard>
</template>
