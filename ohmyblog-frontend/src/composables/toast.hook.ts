// src/composables/toast.hook.ts
import { h } from "vue";
import { toast, type ToastContainerOptions } from "vue3-toastify";

// 引入你封装好的 .vue 图标组件
import Error from "@/components/icon/toast/Error.vue";
import Success from "@/components/icon/toast/Success.vue";
import Info from "@/components/icon/toast/Info.vue";
import Warn from "@/components/icon/toast/Warn.vue";
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
        return h(Success);
      case "error":
        return h(Error);
      case "info":
        return h(Info);
      case "warning":
        return h(Warn);
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
