// src/composables/toast.hook.ts
import { h } from "vue";
import { toast, type ToastContainerOptions } from "vue3-toastify";
import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-vue-next";

/**
 * Toastify 全局配置
 */
export const toastConfig: ToastContainerOptions = {
  autoClose: 3000,
  position: "top-right",
  theme: "light",
  icon: ({ type }) => {
    switch (type) {
      case "success":
        return h(CircleCheck);
      case "error":
        return h(CircleX);
      case "info":
        return h(Info);
      case "warning":
        return h(TriangleAlert);
      default:
        return null;
    }
  },
};

export const useToast = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast.info(msg),
  warn: (msg: string) => toast.warning(msg),
};
