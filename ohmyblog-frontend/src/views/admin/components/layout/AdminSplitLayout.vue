<!--
  src/views/admin/components/layout/AdminSplitLayout.vue
  后台页面通用左右分栏布局
  - 左侧：固定宽度列表栏（宽度通过 leftWidth prop 配置，默认 w-100）
  - 右侧：flex-1 详情栏
  - 统一负责 BaseCard 包裹、分栏动画及竖向分隔线
  
  使用方：
    <AdminSplitLayout>
      <template #left>...</template>
      <template #right>...</template>
    </AdminSplitLayout>

  ============================================================================
  TODO[移动端适配 · 主从导航 ★工作量最大、收益面最大]：
  当前是「左列表(固定宽) + 右详情(flex-1)」并排，手机宽度塞不下两栏，必须改为
  Master-Detail（主从）二级导航。把逻辑收敛在本组件内，所有使用方（Emails / Posts /
  FriendLinks 等）一次性受益，无需逐页改：

  - 桌面端（md 及以上）：保持现有左右并排不变。
  - 移动端（< md）：
      1. 默认只显示 #left 列表，占满整宽（leftWidth 在移动端失效，强制 w-full）；
      2. 选中某项后，#right 详情整屏覆盖/切换显示，并在详情顶部提供「返回列表」按钮；
      3. 竖向分隔线 border-r 在移动端隐藏（max-md:border-r-0）。
  - 关键：本组件需要知道“当前是否有选中项”才能决定移动端显示列表还是详情。两种方案：
      a) 新增 prop `hasSelection?: boolean`，由使用方传入（最简单、推荐先用这个）；
      b) 或提供具名作用域插槽 + 内部状态，让使用方通过 emit 通知选中/返回。
    选定后，对应的 PostList / Emails / FriendLinks 页面需补传该状态与“返回”事件。
  - 用 useIsMobile()（见 breakpoint.hook.ts）切换上述两种形态。
  ============================================================================
-->
<script setup lang="ts">
import BaseCard from "@/components/base/card/BaseCard.vue";

withDefaults(
  defineProps<{
    /** 左侧栏宽度 Tailwind class，默认 w-100 */
    leftWidth?: string;
  }>(),
  {
    leftWidth: "w-100",
  },
);
</script>

<template>
  <BaseCard padding="none" class="flex-1 overflow-hidden flex onload-animation">
    <!-- 左侧列表栏 -->
    <div
      :class="[
        leftWidth,
        'border-r border-border/40 flex flex-col bg-bg-muted/10',
        'onload-animation anim-delay-100 z-10',
      ]"
    >
      <slot name="left" />
    </div>

    <!-- 右侧详情栏 -->
    <div class="flex-1 overflow-hidden onload-animation anim-delay-150">
      <slot name="right" />
    </div>
  </BaseCard>
</template>
