// src/stores/setup.store.ts
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useLang } from "@/composables/lang.hook";

export const useSetupStore = defineStore("setup", () => {
  const { t } = useLang();
  // 进度标题对应的国际化键
  const progressTitleKeys = [
    "stores.setup.progress.step1",
    "stores.setup.progress.step2",
    "stores.setup.progress.step3",
    "stores.setup.progress.step4",
    "stores.setup.progress.step5",
  ];
  const currentTitle = computed(() =>
    t(progressTitleKeys[currentStep.value - 1]!),
  );
  const currentStep = ref(1);
  const totalSteps = progressTitleKeys.length;

  // 状态：管理员是否已注册（用于 Step3 的回退处理）
  const isAdminRegistered = ref(false);
  const adminForm = ref({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // 状态：是否启用个性化
  const isPersonalized = ref(false);

  // 状态：是否启用 SMTP
  const isSMTPEnabled = ref(false);

  function next() {
    if (currentStep.value < totalSteps) currentStep.value++;
  }

  function prev() {
    if (currentStep.value > 1) currentStep.value--;
  }

  return {
    currentStep,
    totalSteps,
    currentTitle,
    isAdminRegistered,
    adminForm,
    isPersonalized,
    isSMTPEnabled,
    next,
    prev,
  };
});
