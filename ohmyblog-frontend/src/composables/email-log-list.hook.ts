import { ref, watch, type Ref } from "vue";
import { useInfiniteScroll } from "@vueuse/core";
import { getEmailLogs } from "@/api/email.api";
import { useLang } from "./lang.hook";
import { useToast } from "./toast.hook";
import type {
  EmailLogFilters,
  EmailLogItem,
} from "@/views/admin/components/emails/types";

interface UseEmailLogListOptions {
  pageSize?: number;
  onFetch?: (newItems: EmailLogItem[]) => void;
}

/**
 * 邮件日志列表通用逻辑 Hook
 * 封装了：分页、无限滚动、过滤条件监听、加载状态管理
 */
export function useEmailLogList(
  getFilters: () => EmailLogFilters,
  scrollContainer: Ref<HTMLElement | null>,
  options: UseEmailLogListOptions = {},
) {
  const { pageSize = 20, onFetch } = options;
  const { t } = useLang();

  const list = ref<EmailLogItem[]>([]);
  const total = ref(0);
  const currentPage = ref(1);
  const isLoading = ref(false);
  const isFinished = ref(false);

  const fetchList = async (reset = false) => {
    if (isLoading.value || (isFinished.value && !reset)) return;
    isLoading.value = true;

    // 重置分页状态
    if (reset) {
      currentPage.value = 1;
      isFinished.value = false;
    }

    try {
      const res = await getEmailLogs({
        page: currentPage.value,
        pageSize,
        ...getFilters(),
      });

      const newItems = (res?.list ?? []) as EmailLogItem[];

      if (reset) {
        list.value = newItems;
      } else {
        list.value.push(...newItems);
      }

      total.value = res?.total ?? 0;

      // 判断是否加载完毕
      if (list.value.length >= total.value || newItems.length < pageSize) {
        isFinished.value = true;
      } else {
        currentPage.value++;
      }

      onFetch?.(newItems);
    } catch (error: any) {
      useToast.error(t(`api.errors.${error}`));
    } finally {
      isLoading.value = false;
    }
  };

  // 注册无限滚动
  useInfiniteScroll(
    scrollContainer,
    () => {
      if (!isFinished.value && !isLoading.value) fetchList();
    },
    { distance: 50 },
  );

  // 监听过滤条件变化，自动重置并重新加载
  watch(getFilters, () => fetchList(true), { deep: true });

  return { list, isLoading, isFinished, fetchList };
}
