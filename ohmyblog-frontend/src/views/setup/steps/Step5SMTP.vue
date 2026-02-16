<!-- src/views/setup/steps/Step5SMTP.vue -->
<script setup lang="ts">
import { useRouter } from "vue-router";
import StepLayout from "../components/StepLayout.vue";
import ModuleItem from "../components/ModuleItem.vue";
import SMTPForm from "../components/SMTPForm.vue";
import { useLang } from "@/composables/lang.hook";
import { useSetupStore } from "@/stores/setup.store";
import { useSetupStep } from "@/composables/setup-step.hook";
import { upsertConfig } from "@/api/config.api";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import { useMediaQuery } from "@vueuse/core";
import type { TSMTPConfigUpsertDTO } from "@server/dtos/config.dto";

const { t } = useLang();
const setupStore = useSetupStore();
const { isSubmitting, runStep } = useSetupStep();
const isDesktop = useMediaQuery("(min-width: 1024px)");
const router = useRouter();

// 使用 auto-animate 自动处理子元素的显示/隐藏动画
const [containerRef] = useAutoAnimate();

const handleNext = () => {
  // 仅在启用 SMTP 时执行字段校验
  // 校验器由 SMTPForm 组件在 mounted 时注册到 setupStore
  if (setupStore.isSMTPEnabled && !setupStore.validateSmtpForm()) return;

  runStep(
    async () => {
      // SMTP 未启用时直接跳过保存，仅执行步骤流转
      if (!setupStore.isSMTPEnabled) {
        return { message: "保存成功" };
      }

      // 构建配置对象，过滤空字符串字段
      const configValue: TSMTPConfigUpsertDTO["configValue"] = {
        enabled: setupStore.isSMTPEnabled,
        host: setupStore.smtpForm.host,
        port: setupStore.smtpForm.port,
        username: setupStore.smtpForm.username,
        password: setupStore.smtpForm.password,
        // 只在有值时才包含高级字段
        ...(setupStore.smtpForm.senderEmail && { senderEmail: setupStore.smtpForm.senderEmail }),
        ...(setupStore.smtpForm.senderName && { senderName: setupStore.smtpForm.senderName }),
      };

      return upsertConfig({
        configKey: "smtp",
        configValue,
        description: "SMTP 配置（基础连接与可选发件人信息）",
        isPublic: false, // SMTP 配置包含敏感信息，仅后端可访问
      });
    },
    { autoNext: false },
  ).then(() => {
    // 完成后跳转到 home 页面
    router.push({ name: "home" });
  });
};
</script>

<template>
  <StepLayout
    :title="t('views.setup.steps.step5.title')"
    :description="t('views.setup.steps.step5.description')"
    :loading="isSubmitting"
    :nextText="t('common.finish')"
    @next="handleNext"
  >
    <!-- 可变框容器 -->
    <div ref="containerRef" class="flex flex-col gap-4">
      <ModuleItem
        v-model="setupStore.isSMTPEnabled"
        :title="t('views.setup.steps.step5.smtp.title')"
        :description="t('views.setup.steps.step5.smtp.description')"
        :tag="t('views.setup.steps.step5.smtp.tag')"
      />

      <!-- 移动端/窄屏下的表单：当 lg 以下且启用了 SMTP 时显现 -->
      <div v-if="setupStore.isSMTPEnabled && !isDesktop" class="mt-2">
        <SMTPForm />
      </div>
    </div>
  </StepLayout>
</template>
