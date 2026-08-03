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
    <div
      class="flex-1 flex flex-col md:flex-row gap-6 items-start onload-animation anim-delay-200 min-h-0"
    >
      <!-- TODO: 这里左侧文章列表和右侧卡片的垂直对齐还不够精确，后面要补一版和仪表盘整体节奏一致的对齐策略。 -->
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
