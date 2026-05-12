<script setup lang="ts">
/**
 * 待审批友链数卡片
 * 独立拉取待审批数量，在仪表盘统计行中展示
 */
import { onMounted, ref } from "vue";
import { Link } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import DashboardCardLayout from "../DashboardCardLayout.vue";
import { getFriendLinkPendingCount } from "@/api/friend-link.api";

const { t } = useLang();

const loading = ref(true);
const count = ref<number | null>(null);

onMounted(async () => {
  loading.value = true;
  try {
    const data = await getFriendLinkPendingCount();
    count.value = (data as any)?.count ?? 0;
  } catch {
    count.value = null;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <DashboardCardLayout
    :label="t('views.admin.Dashboard.stats.pendingFriendLinks')"
    :value="count"
    :unit="t('views.admin.Dashboard.stats.unitPending')"
    :loading="loading"
    icon-bg-class="bg-teal-500/10"
    icon-class="text-teal-600"
  >
    <template #icon>
      <Link class="w-5 h-5" />
    </template>
  </DashboardCardLayout>
</template>
