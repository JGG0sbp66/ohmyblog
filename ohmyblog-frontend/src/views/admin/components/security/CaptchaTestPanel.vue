<!-- src/views/admin/components/security/CaptchaTestPanel.vue -->
<!--
  人机验证测试台。

  验证框就地当测试台 —— 你看到的就是访客会看到的，点它本身就在验证密钥对不对。
  错误码翻成人话，让管理员能快速定位问题。
-->
<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import FieldLabel from "@/components/base/input/FieldLabel.vue";
import CaptchaWidget from "@/components/common/captcha/CaptchaWidget.vue";
import { testCaptcha } from "@/api/captcha.api";
import type { TCaptchaProvider } from "@/api/shared";
import { useLang } from "@/composables/lang.hook";

const props = defineProps<{
  provider: TCaptchaProvider;
  siteKey: string;
  secretKey: string;
  /** reCAPTCHA v3 的最低分数线 */
  minScore?: number;
}>();

const { t } = useLang();
const [testRef] = useAutoAnimate();

const captchaRef =
  useTemplateRef<InstanceType<typeof CaptchaWidget>>("captchaRef");
const captchaToken = ref("");
const testStatus = ref<"idle" | "testing" | "passed" | "failed">("idle");
const testMessage = ref("");

/**
 * 把服务商的错误码翻成一句能照着做的话。
 */
const explainErrors = (codes: string[]): string => {
  const first = codes[0];
  if (!first) return t("views.admin.Security.test.errors.unknown");

  const key = `views.admin.Security.test.errors.${first}`;
  const translated = t(key);
  return translated === key
    ? t("views.admin.Security.test.errors.raw", {
        code: codes.join(", "),
      })
    : translated;
};

const handleTest = async () => {
  const token = await captchaRef.value?.execute();
  if (!token) {
    testStatus.value = "failed";
    testMessage.value = t("views.admin.Security.test.needToken");
    return;
  }

  testStatus.value = "testing";
  testMessage.value = "";

  try {
    const res = await testCaptcha({
      provider: props.provider,
      secretKey: props.secretKey.trim(),
      token,
      ...(props.minScore !== undefined ? { minScore: props.minScore } : {}),
    });

    if (res?.passed) {
      testStatus.value = "passed";
      testMessage.value =
        res.score === null
          ? t("views.admin.Security.test.passed")
          : t("views.admin.Security.test.passedWithScore", {
              score: res.score,
            });
    } else {
      testStatus.value = "failed";
      testMessage.value = explainErrors(res?.errorCodes ?? []);
    }
  } catch (error: any) {
    testStatus.value = "failed";
    testMessage.value = t(`api.errors.${error}`);
  } finally {
    captchaRef.value?.reset();
  }
};
</script>

<template>
  <div class="flex flex-col gap-4 rounded-2xl bg-bg-muted/50 p-5">
    <FieldLabel
      :label="t('views.admin.Security.test.label')"
      :tooltip="t('views.admin.Security.test.hint')"
    />

    <CaptchaWidget
      ref="captchaRef"
      v-model="captchaToken"
      :provider="provider"
      :site-key="siteKey"
      action="admin_test"
    />

    <div ref="testRef" class="flex items-center justify-between gap-3">
      <BaseTag v-if="testStatus === 'passed'" type="success">
        {{ testMessage }}
      </BaseTag>
      <BaseTag v-else-if="testStatus === 'failed'" type="error">
        {{ testMessage }}
      </BaseTag>
      <span v-else />

      <ButtonPrimary
        :text="t('views.admin.Security.test.button')"
        :loading="testStatus === 'testing'"
        class="shrink-0"
        @click="handleTest"
      />
    </div>
  </div>
</template>
