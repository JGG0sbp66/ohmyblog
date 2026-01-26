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
    next,
    prev,
  };
});
