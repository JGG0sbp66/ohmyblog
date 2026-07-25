<!-- src/views/admin/pages/Dashboard.page.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useIsMobile } from "@/composables/breakpoint.hook";
import DashboardStatsRow from "@/views/admin/components/dashboard/stats/DashboardStatsRow.vue";
import RecentPostsCard from "@/views/admin/components/dashboard/cards/RecentPostsCard.vue";
import QuickNoteCard from "@/views/admin/components/dashboard/cards/QuickNoteCard.vue";

// 移动端显示区域过小，文章表格会被压扁，直接隐藏只保留统计与速记。
const isMobile = useIsMobile();
const recentPostsRef = ref<InstanceType<typeof RecentPostsCard> | null>(null);
</script>

<template>
  <div class="flex-1 flex flex-col gap-6 onload-animation min-h-0">
    <!-- 上半区域：统计卡片 -->
    <DashboardStatsRow />

    <!-- 下半区域：文章(宽) + 灵感速记(窄，固定高度) -->
    <div
      class="flex-1 flex flex-col md:flex-row gap-6 items-start onload-animation anim-delay-200 min-h-0"
    >
      <RecentPostsCard
        v-if="!isMobile"
        ref="recentPostsRef"
        class="md:flex-2 self-stretch min-h-0"
      />
      <QuickNoteCard class="md:flex-1" @saved="recentPostsRef?.refresh()" />
    </div>
  </div>
</template>
