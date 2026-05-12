<script setup lang="ts">
/**
 * 总访问量卡片
 * 接收 counts 中的 totalViews，在仪表盘统计行中展示
 */
import { computed } from "vue";
import { BarChart3 } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import DashboardCardLayout from "../DashboardCardLayout.vue";

const { t } = useLang();

interface Props {
  counts?: Record<string, number | undefined>;
  loading?: boolean;
}

const props = defineProps<Props>();

const value = computed(() => props.counts?.totalViews ?? null);
</script>

<template>
  <DashboardCardLayout
    :label="t('views.admin.Dashboard.stats.totalVisits')"
    :value="value"
    :loading="loading ?? false"
    icon-bg-class="bg-blue-500/10"
    icon-class="text-blue-600"
  >
    <template #icon>
      <BarChart3 class="w-5 h-5" />
    </template>
  </DashboardCardLayout>
</template>
