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
  <!--
    仪表盘是钉在可视高度内的定高布局：AdminLayout 包裹层与本页面根节点都用
    min-h-0 把自己压进可视高度，溢出由各列内部滚动消化。根节点的 min-h-0 不能删，
    否则右列卡片的最小内容高度会戳破本页面、把滚动打落到 main 上。
  -->
  <div class="flex-1 flex flex-col gap-6 onload-animation min-h-0">
    <!-- 上半区域：统计卡片，占自然高度 -->
    <DashboardStatsRow />

    <!--
      下半区域：左右分栏填满剩余高度（min-h-0 允许被压扁，溢出才有处可去）。
      - 左列复用 PostList，定高内部自滚、上下贴边；
      - 右列把灵感速记 + 系统信息捆绑成一个滚动单元（与设置页
        SettingsPageLayout 右侧表单区同款思路）：视口过矮时只滚右列，
        统计行与左列保持钉住，也不会再有内容戳破底部 padding 贴死视口底边。
    -->
    <div
      class="flex-1 min-h-0 flex flex-col md:flex-row gap-6 onload-animation anim-delay-200"
    >
      <RecentPostsCard
        v-if="!isMobile"
        ref="recentPostsRef"
        class="md:flex-2 min-h-0"
      />
      <!--
        右列滚动单元。滚动容器用 absolute + 负 margin/正 padding 把裁剪区向外
        扩展（SettingsPageLayout 同款手法）：卡片的 shadow-lg 主要向下与两侧
        延展，直接 overflow 会被齐边切掉。出血量必须与 main 的 padding 联动
        （移动端 p-3 / 桌面 md:p-6）：扩到 padding 里不占额外空间，一旦超过
        就会把 main 撑出水平滚动条。顶部阴影几乎可忽略，与设置页一致不扩。
      -->
      <div class="flex-1 min-h-0 relative">
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden -mx-3 px-3 -mb-3 pb-3 md:-mx-6 md:px-6 md:-mb-6 md:pb-6 custom-scrollbar"
        >
          <div class="flex flex-col gap-6">
            <QuickNoteCard @saved="recentPostsRef?.refresh()" />
            <SystemInfoCard />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
