// src/stores/setup.store.ts
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";

export const useSetupStore = defineStore("setup", () => {
    const { t } = useI18n();
    const currentStep = ref(1);
    const totalSteps = 5;
    // 进度标题对应的国际化键
    const progressTitleKeys = [
        "stores.setup.progress.step1",
        "stores.setup.progress.step2",
        "stores.setup.progress.step3",
        "stores.setup.progress.step4",
        "stores.setup.progress.step5",
    ];
    const currentTitle = computed(() =>
        t(progressTitleKeys[currentStep.value - 1]!)
    );

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
