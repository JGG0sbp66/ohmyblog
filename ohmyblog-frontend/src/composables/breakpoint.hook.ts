// src/composables/breakpoint.hook.ts
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

/**
 * 与 Tailwind 默认断点保持一致的响应式断点集合。
 * 如果项目后续自定义了 Tailwind 的 --breakpoint-*，需要同步更新这里。
 */
const breakpoints = useBreakpoints(breakpointsTailwind);

/** 小于 md（768px）时视为移动端。 */
export function useIsMobile() {
  return breakpoints.smaller("md");
}
