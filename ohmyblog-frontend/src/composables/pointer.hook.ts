// src/composables/pointer.hook.ts
import { useMediaQuery } from "@vueuse/core";

/**
 * 指针能力查询 —— 回答「这台设备能不能悬停」，与屏幕多宽**无关**。
 *
 * 和 breakpoint.hook 的 useIsMobile 是两个维度，不要互相代替：
 * - useIsMobile（宽度 < md）管**布局**：设置面板要不要变抽屉、顶部栏要不要收起、
 *   列表要不要砍掉次要列。窄窗口的桌面浏览器同样需要这些。
 * - 本文件管**交互能力**：hover 驱动的浮层（气泡菜单、拖拽手柄、表格行列把手）
 *   在没有悬停的设备上根本不会出现，必须换一套入口。
 *
 * 混用过一次，代价是真实的：编辑器曾用宽度断点当「触屏」判据，于是 ≥768px 的
 * 触屏平板拿到了一整套够不着的 hover 控件，而窄窗口的桌面浏览器反倒丢掉了
 * 气泡菜单和拖拽手柄。
 */

/**
 * 能悬停 —— 有真正的 hover 且是精确指针。
 *
 * 触屏笔记本会命中这一条（它有鼠标，primary pointer 是 fine），这是期望行为：
 * 那类设备上 hover 提示与浮层都是可用的。
 */
export function useCanHover() {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/**
 * 纯触屏 —— 完全没有悬停能力。
 *
 * 只查 `hover`，不查 `pointer`：我们依赖的能力就是「悬停」本身，而 pointer 的
 * 粗细讲的是触控目标尺寸，是另一件事。触屏笔记本因为有鼠标而报 hover: hover，
 * 不会命中这里 —— 正是想要的结果。
 */
export function useIsTouchOnly() {
  return useMediaQuery("(hover: none)");
}
