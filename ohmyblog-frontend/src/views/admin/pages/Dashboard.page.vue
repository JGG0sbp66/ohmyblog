<!-- src/views/admin/pages/Dashboard.page.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useIsMobile } from "@/composables/breakpoint.hook";
import DashboardStatsRow from "@/views/admin/components/dashboard/stats/DashboardStatsRow.vue";
import RecentPostsCard from "@/views/admin/components/dashboard/cards/RecentPostsCard.vue";
import QuickNoteCard from "@/views/admin/components/dashboard/cards/QuickNoteCard.vue";
import SystemInfoCard from "@/views/admin/components/dashboard/cards/SystemInfoCard.vue";

// 移动端显示区域过小，文章表格会被压扁，直接隐藏只保留统计与速记。
// 移动端与桌面端采用两套布局：移动端整页自然流式滚动，桌面端保持定高内滚。
const isMobile = useIsMobile();
const recentPostsRef = ref<InstanceType<typeof RecentPostsCard> | null>(null);
</script>

<template>
  <!--
    两套断点布局，互不干扰：
    - 桌面端：钉在可视高度内的定高布局，AdminLayout 包裹层与本页面根节点都用
      min-h-0 把自己压进可视高度，溢出由各列内部滚动消化。根节点的 min-h-0
      不能删，否则右列卡片的最小内容高度会戳破本页面、把滚动打落到 main 上。
    - 移动端：解除定高约束，内容自然撑高、滚动落到 main 上整页滚动，
      避免统计卡片被钉死在顶部、仅剩狭小内滚区域可用。注意溢出的内容会
      吞掉 main 的 padding-bottom，根节点的 pb-3 把它补回来，滚到底时底部
      留白与设置页的内滚方案（-mb-3 pb-3 出血）一致。
  -->
  <div
    :class="[
      'flex-1 flex flex-col gap-6 onload-animation',
      isMobile ? 'pb-3' : 'min-h-0',
    ]"
  >
    <!-- 上半区域：统计卡片，占自然高度 -->
    <DashboardStatsRow />

    <!--
      下半区域：
      - 桌面端：左右分栏填满剩余高度（min-h-0 允许被压扁，溢出才有处可去）。
        左列复用 PostList，定高内部自滚、上下贴边；右列把灵感速记 + 系统信息
        捆绑成一个滚动单元（与设置页 SettingsPageLayout 右侧表单区同款思路）：
        视口过矮时只滚右列，统计行与左列保持钉住，也不会再有内容戳破底部
        padding 贴死视口底边。
      - 移动端：正常纵向流，随整页滚动。
    -->
    <div
      :class="[
        'flex gap-6 onload-animation anim-delay-200',
        isMobile ? 'flex-col' : 'flex-1 min-h-0 flex-row',
      ]"
    >
      <RecentPostsCard
        v-if="!isMobile"
        ref="recentPostsRef"
        class="md:flex-2 min-h-0"
      />
      <!--
        右列。移动端直接进文档流；桌面端是滚动单元，滚动容器用 absolute +
        负 margin/正 padding 把裁剪区向外扩展（SettingsPageLayout 同款手法）：
        卡片的 shadow-lg 主要向下与两侧延展，直接 overflow 会被齐边切掉。
        出血量与 main 的桌面 padding（md:p-6）联动：扩到 padding 里不占额外
        空间，一旦超过就会把 main 撑出水平滚动条。顶部阴影几乎可忽略，与
        设置页一致不扩。
      -->
      <div :class="isMobile ? '' : 'flex-1 min-h-0 relative'">
        <div
          :class="[
            isMobile
              ? 'flex flex-col gap-6'
              : 'absolute inset-0 flex flex-col gap-6 overflow-y-auto overflow-x-hidden -mx-6 px-6 -mb-6 pb-6 custom-scrollbar',
          ]"
        >
          <QuickNoteCard @saved="recentPostsRef?.refresh()" />
          <SystemInfoCard />
        </div>
      </div>
    </div>
  </div>
</template>
