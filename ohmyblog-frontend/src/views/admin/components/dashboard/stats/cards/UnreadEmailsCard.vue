<script setup lang="ts">
/**
 * 未读邮件数卡片
 * 独立拉取未读邮件数据，在仪表盘统计行中展示
 */
import { computed, onMounted, ref } from "vue";
import { Mail } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import DashboardCardLayout from "../DashboardCardLayout.vue";
import { useEmailStore } from "@/stores/email.store";

const loading = ref(true);

const emailStore = useEmailStore();
const { unreadCount } = storeToRefs(emailStore);

const unreadEmailCount = computed(() => unreadCount.value);

onMounted(async () => {
  loading.value = true;
  await emailStore.fetchUnreadCount();
  loading.value = false;
});
</script>

<template>
  <DashboardCardLayout
    label="未读邮件数"
    :value="unreadEmailCount"
    unit="需阅读"
    :loading="loading"
    icon-bg-class="bg-orange-500/10"
    icon-class="text-orange-600"
  >
    <template #icon>
      <Mail class="w-5 h-5" />
    </template>
  </DashboardCardLayout>
</template>
