// src/composables/stable-key.hook.ts

/**
 * 给列表里的对象发一个**跟着对象走**的稳定 key。
 *
 * ## 为什么需要它
 *
 * `v-for` 用数组下标做 key 时，重排数组不会让 Vue 搬动 DOM —— 它只会原地改内容
 * （第 1 个节点渲染第 2 条数据，反之亦然）。静态列表看不出差别，可拖拽列表会出两个问题：
 *
 * 1. 让位动画无从计算：元素根本没动过，量不到「从哪来、到哪去」
 * 2. 被拖的节点会在换序瞬间把内容甩给隔壁，视觉上像整个列表闪了一下
 *
 * 改用对象身份做 key，重排就变成真正的 DOM 搬迁，动画和拖拽状态都能挂在同一个节点上。
 *
 * ## 为什么不直接给数据加 id
 *
 * 页脚分组这类数据是**要整份存回后端**的配置 JSON（`site_info`），
 * 塞一个前端自用的 id 进去就会污染 DTO 和数据库里的内容。
 * 用 WeakMap 把「对象 → 序号」放在组件这一侧，数据结构一个字节都不动，
 * 对象被删掉后条目也随之被 GC 回收。
 *
 * 注意：`v-for` 遍历响应式数组拿到的是 **Proxy**，同一个原始对象的 Proxy 是同一个
 * （Vue 内部缓存），所以拿 Proxy 当 WeakMap 的键是稳的。反过来，从后端重新拉配置后
 * 对象整体换新，key 也会全部换新 —— 这正是我们要的（那就该整列表重渲染）。
 *
 * ```ts
 * const keyOf = useStableKey();
 * // <div v-for="(g, i) in groups" :key="keyOf(g)">
 * ```
 */
export function useStableKey() {
  const ids = new WeakMap<object, number>();
  let nextId = 0;

  return (item: object): number => {
    let id = ids.get(item);
    if (id === undefined) {
      id = nextId++;
      ids.set(item, id);
    }
    return id;
  };
}
