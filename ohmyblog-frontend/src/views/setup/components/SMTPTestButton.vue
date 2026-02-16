<!-- src/views/setup/components/SMTPTestButton.vue -->
<script setup lang="ts">
/**
 * SMTP 连接测试按钮组件
 * 
 * 功能：
 * 1. 监听 store 中的 SMTP 表单数据
 * 2. 当必填字段（host/port/username/password）都填写后显示测试按钮
 * 3. 点击按钮测试 SMTP 连接，显示测试结果（成功/失败）
 */
import { ref, computed } from "vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import { useLang } from "@/composables/lang.hook";
import { useSetupStore } from "@/stores/setup.store";
import { testSMTPConnection } from "@/api/email.api";

const { t } = useLang();
const setupStore = useSetupStore();

/**
 * 测试状态
 * - idle: 初始状态，未开始测试
 * - testing: 正在测试中（显示加载状态）
 * - success: 测试成功（显示绿色成功标签）
 * - error: 测试失败（显示红色失败标签）
 */
const testStatus = ref<"idle" | "testing" | "success" | "error">("idle");

/** 测试结果消息（成功或失败的提示文本） */
const testMessage = ref("");

/**
 * 检查是否可以显示测试按钮
 * 只有当四个必填字段都填写后才显示
 */
const canShowTest = computed(() => {
  return (
    setupStore.smtpForm.host.trim() !== "" &&
    setupStore.smtpForm.port > 0 &&
    setupStore.smtpForm.username.trim() !== "" &&
    setupStore.smtpForm.password.trim() !== ""
  );
});

/**
 * 构建测试配置对象
 * 根据实测，后端只需要这五个字段：enabled, host, port, username, password
 */
const testConfig = computed(() => ({
  enabled: setupStore.isSMTPEnabled,
  host: setupStore.smtpForm.host,
  port: setupStore.smtpForm.port,
  username: setupStore.smtpForm.username,
  password: setupStore.smtpForm.password,
}));

/**
 * 测试 SMTP 连接
 * 调用后端接口验证配置是否正确
 */
const handleTestConnection = async () => {
  testStatus.value = "testing";
  testMessage.value = "";

  try {
    await testSMTPConnection(testConfig.value);

    testStatus.value = "success";
    testMessage.value = t("views.setup.steps.step5.test.success");
  } catch (error: any) {
    testStatus.value = "error";
    testMessage.value = error?.message || t("views.setup.steps.step5.test.error");
  }
};
</script>

<template>
  <!-- 只有当必填字段都填写后才显示整个测试区域 -->
  <div v-if="canShowTest" class="flex items-center justify-between gap-3">
    <!-- 左侧：测试结果标签 -->
    <div class="flex items-center gap-2">
      <BaseTag v-if="testStatus === 'success'" type="success" size="sm">
        {{ testMessage }}
      </BaseTag>
      <BaseTag v-else-if="testStatus === 'error'" type="error" size="sm">
        {{ testMessage }}
      </BaseTag>
    </div>

    <!-- 右侧：测试按钮 -->
    <ButtonPrimary
      :text="t('views.setup.steps.step5.test.button')"
      :disabled="testStatus === 'testing'"
      :loading="testStatus === 'testing'"
      @click="handleTestConnection"
    />
  </div>
</template>
