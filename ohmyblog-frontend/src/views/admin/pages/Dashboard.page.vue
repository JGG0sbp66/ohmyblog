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
         两边底边天然对不齐——这里选择不去强行拉平。右列按 gap-6 依次往下排，
         富余空间留在最底部：把空隙塞到两卡之间（justify-between）虽然能让四角对齐，
         但会割裂「速记 → 系统信息」的阅读顺序，代价比参差的底边大。 -->
    <div
      class="flex-1 flex flex-col md:flex-row gap-6 items-start onload-animation anim-delay-200 min-h-0"
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
