// src/composables/friend-link-list.hook.ts
import { ref, watch, type Ref } from "vue";
import { useInfiniteScroll } from "@vueuse/core";
import { getFriendLinks } from "@/api/friend-link.api";
import { useLang } from "./lang.hook";
import { useToast } from "./toast.hook";
import type {
  FriendLinkItem,
  FriendLinkFilters,
} from "@/views/admin/components/friend-links/types";

interface UseFriendLinkListOptions {
  pageSize?: number;
  onFetch?: (newItems: FriendLinkItem[]) => void;
}

/**
 * 友链列表通用逻辑 Hook
 * 封装了：分页、无限滚动、过滤条件监听、加载状态管理
 */
export function useFriendLinkList(
  getFilters: () => FriendLinkFilters,
  scrollContainer: Ref<HTMLElement | null>,
  options: UseFriendLinkListOptions = {},
) {
  const { pageSize = 20, onFetch } = options;
  const { t } = useLang();

  const list = ref<FriendLinkItem[]>([]);
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
      const res = await getFriendLinks({
        page: currentPage.value,
        pageSize,
        ...getFilters(),
      });

      const newItems = ((res as any)?.list ?? []) as FriendLinkItem[];

      if (reset) {
        list.value = newItems;
      } else {
        list.value.push(...newItems);
      }

      total.value = (res as any)?.total ?? 0;

      // 判断是否已加载完毕
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
