<script setup lang="ts">
/**
 * 已发布文章数卡片
 * 接收 counts 中的 published，在仪表盘统计行中展示
 */
import { computed } from "vue";
import { FileText } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import DashboardCardLayout from "../DashboardCardLayout.vue";

const { t } = useLang();

interface Props {
  counts?: Record<string, number | undefined>;
  loading?: boolean;
}

const props = defineProps<Props>();

const publishedCount = computed(() => props.counts?.published ?? null);
</script>

<template>
  <DashboardCardLayout
    :label="t('views.admin.Dashboard.stats.publishedPosts')"
    :value="publishedCount"
    :unit="t('views.admin.Dashboard.stats.unitPosts')"
    :loading="loading ?? false"
    icon-bg-class="bg-emerald-500/10"
    icon-class="text-emerald-600"
  >
    <template #icon>
      <FileText class="w-5 h-5" />
    </template>
  </DashboardCardLayout>
</template>
