import { ref, computed, watch, type Ref } from "vue";
import { generateId } from "@/utils/id";

interface ListEditorOptions<T, R> {
  /** 初始数据源（来自 Store） */
  initialSource: R[];
  /** 每页条数 */
  pageSize: number;
  /** 将原始数据转换为本地带 ID 的格式 */
  mapToLocal: (item: R) => T;
  /** 将本地数据转换回原始格式 */
  mapToRemote: (item: T) => R;
  /** 数据变化时的回调（用于同步回 Store） */
  onSync: (items: R[]) => void;
  /** 创建新项时的默认值 */
  newItemFactory: () => T;
}

/**
 * 通用的列表编辑逻辑 Hook
 * 处理带 ID 的本地状态、分页计算、增删跳转以及数据同步
 */
export function useListEditor<T extends { id: string }, R>(
  options: ListEditorOptions<T, R>
) {
  const {
    initialSource,
    pageSize,
    mapToLocal,
    mapToRemote,
    onSync,
    newItemFactory,
  } = options;

  // 1. 本地状态
  const items = ref<T[]>(initialSource.map(mapToLocal)) as Ref<T[]>;

  // 2. 分页逻辑
  const currentPage = ref(1);
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(items.value.length / pageSize))
  );

  const pagedRows = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    const end = start + pageSize;
    return items.value.slice(start, end);
  });

  // 3. 数据同步
  watch(
    items,
    (newItems) => {
      onSync(newItems.map(mapToRemote));
    },
    { deep: true }
  );

  // 4. 操作方法
  const addItem = () => {
    const newItem = { ...newItemFactory(), id: generateId() };
    items.value.push(newItem);

    // 自动跳转到最后一页
    if (totalPages.value > currentPage.value) {
      currentPage.value = totalPages.value;
    }
  };

  const removeItem = (id: string) => {
    const index = items.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      items.value.splice(index, 1);
      // 页码纠偏
      if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value;
      }
    }
  };

  const updateItem = (id: string, updates: Partial<T>) => {
    const item = items.value.find((item) => item.id === id);
    if (item) {
      Object.assign(item, updates);
    }
  };

  return {
    items,
    currentPage,
    totalPages,
    pagedRows,
    addItem,
    removeItem,
    updateItem,
  };
}
