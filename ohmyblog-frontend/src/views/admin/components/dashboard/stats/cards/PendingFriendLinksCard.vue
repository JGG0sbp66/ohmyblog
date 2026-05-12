<script setup lang="ts">
/**
 * 待审批友链数卡片
 * 通过 useFriendLinkStore 读取共享 pendingCount，与侧边栏 badge 保持同步
 */
import { onMounted, ref } from "vue";
import { Link } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { useLang } from "@/composables/lang.hook";
import DashboardCardLayout from "../DashboardCardLayout.vue";
import { useFriendLinkStore } from "@/stores/friend-link.store";

const { t } = useLang();

const loading = ref(true);

const friendLinkStore = useFriendLinkStore();
const { pendingCount } = storeToRefs(friendLinkStore);

onMounted(async () => {
  loading.value = true;
  await friendLinkStore.fetchPendingCount();
  loading.value = false;
});
</script>

<template>
  <DashboardCardLayout
    :label="t('views.admin.Dashboard.stats.pendingFriendLinks')"
    :value="pendingCount"
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
