<script setup lang="ts">
/**
 * 草稿文章数卡片
 * 接收 counts 中的 draft，在仪表盘统计行中展示
 */
import { computed } from "vue";
import { Pencil } from "lucide-vue-next";
import DashboardCardLayout from "../DashboardCardLayout.vue";

interface Props {
  counts?: Record<string, number | undefined>;
  loading?: boolean;
}

const props = defineProps<Props>();

const draftCount = computed(() => props.counts?.draft ?? null);
</script>

<template>
  <DashboardCardLayout
    label="草稿文章数"
    :value="draftCount"
    unit="篇"
    :loading="loading ?? false"
    icon-bg-class="bg-violet-500/10"
    icon-class="text-violet-600"
  >
    <template #icon>
      <Pencil class="w-5 h-5" />
    </template>
  </DashboardCardLayout>
</template>
