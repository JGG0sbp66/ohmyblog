import { ref, computed, watch, type Ref } from "vue";
import { generateId } from "@/utils/id";

/**
 * TBody: 纯业务数据结构 (不含 ID)
 * R: 原始数据格式 (Store/API 中的格式)
 */
interface ListEditorOptions<TBody, R> {
  /** 初始数据源 (来自 Store) */
  initialSource: R[];
  /** 每页条数 */
  pageSize: number;
  /** 将原始数据转换为业务 Body */
  mapToLocal: (item: R) => TBody;
  /** 将业务 Body 转换回原始格式 */
  mapToRemote: (body: TBody) => R;
  /** 数据变化时的回调 (同步回 Store，此时 ID 已被剔除) */
  onSync: (items: R[]) => void;
  /** 创建新项时的默认业务 Body */
  newItemFactory: () => TBody;
}

/** 内部使用的包装类型，包含唯一的渲染 ID */
export type ManagedItem<TBody> = TBody & { id: string };

/**
 * 通用的列表编辑逻辑 Hook
 * 核心设计：业务逻辑只关注数据本身，ID 的管理对于外部是透明的。
 */
export function useListEditor<TBody extends object, R>(
  options: ListEditorOptions<TBody, R>,
) {
  const {
    initialSource,
    pageSize,
    mapToLocal,
    mapToRemote,
    onSync,
    newItemFactory,
  } = options;

  // 1. 本地状态：初始化时自动注入唯一 ID
  const items = ref<ManagedItem<TBody>[]>(
    initialSource.map((item) => ({
      ...mapToLocal(item),
      id: generateId(),
    })),
  ) as Ref<ManagedItem<TBody>[]>;

  // 2. 分页逻辑
  const currentPage = ref(1);
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(items.value.length / pageSize)),
  );

  const pagedRows = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    const end = start + pageSize;
    return items.value.slice(start, end);
  });

  // 3. 数据同步：剔除 ID 后同步回外部
  watch(
    items,
    (newItems) => {
      onSync(
        newItems.map((item) => {
          const { id: _, ...body } = item;
          // clone 以断开深层对象的引用，防止外部修改导致此处数据被静默更新
          return mapToRemote(JSON.parse(JSON.stringify(body)));
        }),
      );
    },
    { deep: true },
  );

  // 4. 操作方法
  /** 新增项：自动注入 ID */
  const addItem = () => {
    const newItem = {
      ...newItemFactory(),
      id: generateId(),
    };
    items.value.push(newItem as ManagedItem<TBody>);

    // 自动跳转到新产生的页面
    if (totalPages.value > currentPage.value) {
      currentPage.value = totalPages.value;
    }
  };

  /** 移除项 */
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

  /** 更新项：采用不可变方式更新对象，确保触发完整响应式 */
  const updateItem = (id: string, updates: Partial<TBody>) => {
    const index = items.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      // 通过解构并重新赋值触发 Vue 的响应式追踪，特别是对深层嵌套对象
      items.value[index] = {
        ...items.value[index],
        ...updates,
      } as ManagedItem<TBody>;
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
