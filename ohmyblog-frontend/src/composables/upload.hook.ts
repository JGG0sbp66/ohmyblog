// src/composables/upload.hook.ts
import { ref } from "vue";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";
import type ImageUpload from "@/components/base/upload/ImageUpload.vue";

/**
 * 通用图片上传逻辑 Hook
 * 封装了加载状态管理、组件引用触发以及统一的上传后处理逻辑
 */
export function useImageUpload() {
  const { t } = useLang();

  // 上传中的加载状态
  const loading = ref(false);

  // 对 ImageUpload 组件实例的引用
  const uploadRef = ref<InstanceType<typeof ImageUpload> | null>(null);

  /**
   * 编程式触发文件选择对话框
   */
  const trigger = () => {
    uploadRef.value?.triggerClick();
  };

  /**
   * 生成上传按钮文字的辅助函数
   * @param baseKey i18n 的基础路径 (例如：views.setup.steps.step2.siteIcon)
   * @param hasValue 是否已有值 (通常是绑定到 v-model 的图片 URL)
   */
  const getButtonText = (baseKey: string, hasValue: any) => {
    if (loading.value) return t(`${baseKey}.uploading`);
    return hasValue ? t(`${baseKey}.change`) : t(`${baseKey}.upload`);
  };

  /**
   * 执行上传核心逻辑
   * @param file 待上传的文件
   * @param apiFn 对应的 API 调用函数 (如 uploadAvatar)
   * @param onSuccess 上传成功后的回调 (通常用于更新 Store 中的 URL)
   * @param successMsgKey 可选：成功时展示的 i18n 提示文本 Key
   */
  const handleUpload = async (
    file: File,
    apiFn: (file: File) => Promise<any>,
    onSuccess: () => void,
    successMsgKey?: string,
  ) => {
    try {
      loading.value = true;
      // 执行 API 请求
      await apiFn(file);

      // 执行业务成功回调
      onSuccess();

      // 展示成功提示
      if (successMsgKey) {
        useToast.success(t(successMsgKey));
      }
    } catch (error: any) {
      // 这里的 error 可能是 string (unwrap 抛出) 或 Error 对象
      const errorMsg = typeof error === "string" ? error : error?.message || "Error";
      useToast.error(t(`api.errors.${errorMsg}`));
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    uploadRef,
    trigger,
    getButtonText,
    handleUpload,
  };
}

