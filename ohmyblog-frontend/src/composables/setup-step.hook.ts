// src/composables/setup-step.hook.ts
import { ref } from "vue";
import { useSetupStore } from "@/stores/setup.store";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";

/**
 * 可校验组件的接口定义
 */
export interface Validatable {
  validate: () => boolean;
}

/**
 * 设置步骤通用逻辑 Hook
 * 封装了 Loading 状态、API 调用包装、通知提示以及自动跳转下一步
 */
export function useSetupStep() {
  const isSubmitting = ref(false);
  const { t } = useLang();
  const stepStore = useSetupStore();

  /**
   * 执行步骤提交操作
   * @param action 异步操作函数，需返回 Promise
   * @param options 配置项
   */
  async function runStep(
    action: () => Promise<any>,
    options: {
      validate?: (Validatable | null | undefined)[]; // 需要校验的组件列表
      autoNext?: boolean; // 是否自动跳转到下一步，默认为 true
    } = {},
  ) {
    if (isSubmitting.value) return;

    const { validate, autoNext = true } = options;

    // 执行校验逻辑
    if (validate && validate.length > 0) {
      // 校验数组中的每一项，并确保所有项的 validate 方法都被执行（以触发 UI 报错）
      const isValid = validate
        .map((item) => item?.validate?.() ?? true)
        .every((res) => res === true);

      if (!isValid) return; // 校验不通过，拦截提交
    }

    try {
      isSubmitting.value = true;
      const res = await action();

      // 成功提示处理：如果接口返回了 message，默认尝试从 api.success.config 寻找翻译
      if (res?.message) {
        useToast.success(t(`api.success.config.${res.message}`));
      }

      // 自动跳转
      if (autoNext) {
        stepStore.next();
      }

      return res;
    } catch (error: any) {
      // 统一错误提示
      useToast.error(t(`api.errors.${error}`));
      throw error; // 抛出错误供组件端可能的特殊处理
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    isSubmitting,
    runStep,
  };
}
