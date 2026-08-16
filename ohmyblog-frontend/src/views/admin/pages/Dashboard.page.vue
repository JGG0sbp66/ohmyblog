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
  <div class="flex-1 flex flex-col gap-6 onload-animation">
    <!-- 上半区域：统计卡片 -->
    <DashboardStatsRow />

    <!-- 下半区域：文章(宽) + 右侧列(灵感速记 + 系统信息) -->
    <!-- 左列撑满剩余高度、内部自滚；右列按内容自然高度往下排，不强行拉平两列底边。
         视口不够高时整页滚动，统计行也一起滚走——因此从 root 到 row 的整条链都
         不能加 min-h-0：一旦允许被压扁，右列就会戳破 row 向下溢出，而这种 flex
         溢出不会被 main 的滚动范围完整计入（Chromium 会少算），系统信息卡片会
         贴死视口底边、连 main 的 padding-bottom 都滚不出来。 -->
    <div
      class="flex-1 flex flex-col md:flex-row gap-6 items-start onload-animation anim-delay-200"
    >
      <RecentPostsCard
        v-if="!isMobile"
        ref="recentPostsRef"
        class="md:flex-2 self-stretch min-h-0"
      />
      <div class="w-full md:flex-1 flex flex-col gap-6">
        <QuickNoteCard @saved="recentPostsRef?.refresh()" />
        <SystemInfoCard />
      </div>
    </div>
  </div>
</template>
