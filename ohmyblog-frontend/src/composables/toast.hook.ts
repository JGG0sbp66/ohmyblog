// src/composables/toast.hook.ts
import { toast } from "vue-sonner";

/**
 * 统一 Toast 调用入口
 * API 形状与原 vue3-toastify 版本保持一致，业务侧无需改动。
 */
export const useToast = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast.info(msg),
  warn: (msg: string) => toast.warning(msg),
};
