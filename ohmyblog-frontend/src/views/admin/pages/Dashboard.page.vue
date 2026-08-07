<!-- src/views/admin/pages/Dashboard.page.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useIsMobile } from "@/composables/breakpoint.hook";
import DashboardStatsRow from "@/views/admin/components/dashboard/stats/DashboardStatsRow.vue";
import RecentPostsCard from "@/views/admin/components/dashboard/cards/RecentPostsCard.vue";
import QuickNoteCard from "@/views/admin/components/dashboard/cards/QuickNoteCard.vue";
import SystemInfoCard from "@/views/admin/components/dashboard/cards/SystemInfoCard.vue";

// 移动端显示区域过小，文章表格会被压扁，直接隐藏只保留统计与速记。
const isMobile = useIsMobile();
const recentPostsRef = ref<InstanceType<typeof RecentPostsCard> | null>(null);
</script>

<template>
  <div class="flex-1 flex flex-col gap-6 onload-animation min-h-0">
    <!-- 上半区域：统计卡片 -->
    <DashboardStatsRow />

    <!-- 下半区域：文章(宽) + 右侧列(灵感速记 + 系统信息) -->
    <!-- 对齐策略：左列是撑满剩余高度、内部自滚的列表卡，右列两张卡都是内容高度，
         两边底边天然对不齐。这里让右列一起拉伸（去掉 items-start），首尾两张卡分别
         贴住左卡的上下边，富余空间落到两卡之间——gap-6 仍是它们的最小间距，
         于是无论视口多高，四个角始终对齐，间距也保持仪表盘的 6 号栅格节奏。 -->
    <div
      class="flex-1 flex flex-col md:flex-row gap-6 onload-animation anim-delay-200 min-h-0"
    >
      <RecentPostsCard
        v-if="!isMobile"
        ref="recentPostsRef"
        class="md:flex-2 min-h-0"
      />
      <div
        class="w-full md:flex-1 flex flex-col gap-6 md:justify-between min-h-0"
      >
        <QuickNoteCard @saved="recentPostsRef?.refresh()" />
        <SystemInfoCard />
      </div>
    </div>
  </div>
</template>
