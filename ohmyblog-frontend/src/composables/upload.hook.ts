// src/composables/upload.hook.ts
import { ref } from "vue";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";
import { uploadLimitMessage } from "@/api/shared";
import type ImageUpload from "@/components/base/upload/ImageUpload.vue";

/**
 * 上传前的大小预校验
 *
 * 后端 DTO 同样会拦（那才是硬边界），这里只是省掉把超限文件整个传完
 * 才被拒绝的等待。文案由 uploadLimitMessage 派生，与后端返回的完全一致，
 * 所以两条路径命中的是同一个 i18n 词条。
 *
 * @param file 待上传文件
 * @param maxSize 大小上限（字节），取自 UPLOAD_LIMITS
 * @returns 通过校验返回 true；超限则弹出提示并返回 false
 */
export function checkImageSize(file: File, maxSize: number): boolean {
  if (file.size <= maxSize) return true;

  const { t } = useLang();
  useToast.error(t(`api.errors.${uploadLimitMessage(maxSize)}`));
  return false;
}

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
   * @param onSuccess 上传成功后的回调，接收带时间戳的 URL (用于更新 Store)
   * @param maxSize 大小上限（字节），取自 UPLOAD_LIMITS，超限直接本地拦下不发请求
   */
  const handleUpload = async (
    file: File,
    apiFn: (file: File) => Promise<{ url: string; message?: string } | null>,
    onSuccess: (urlWithTimestamp: string) => void,
    maxSize: number,
  ) => {
    if (!checkImageSize(file, maxSize)) return;

    try {
      loading.value = true;
      // 执行 API 请求，获取后端返回的数据
      const result = await apiFn(file);

      if (!result?.url) {
        throw new Error("EMPTY_UPLOAD_REPLY");
      }

      // 自动为 URL 添加时间戳，绕过浏览器缓存
      const urlWithTimestamp = `${result.url}?t=${Date.now()}`;

      // 执行业务成功回调，传入带时间戳的 URL
      onSuccess(urlWithTimestamp);

      // 展示成功提示
      if (result?.message) {
        useToast.success(t(`api.success.${result.message}`));
      }
    } catch (error: any) {
      // 这里的 error 可能是 string (unwrap 抛出) 或 Error 对象
      const errorMsg =
        typeof error === "string" ? error : error?.message || "Error";
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
