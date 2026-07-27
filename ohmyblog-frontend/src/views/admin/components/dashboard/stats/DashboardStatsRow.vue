<script setup lang="ts">
/**
 * 仪表盘统计卡片行
 * 统一拉取文章计数数据，移动端以 2×2、桌面端以 4 列展示统计信息
 */
import { onMounted, ref } from "vue";
import TotalVisitsCard from "./cards/TotalVisitsCard.vue";
import PublishedPostsCard from "./cards/PublishedPostsCard.vue";
import PendingFriendLinksCard from "./cards/PendingFriendLinksCard.vue";
import UnreadEmailsCard from "./cards/UnreadEmailsCard.vue";
import { getPostCounts } from "@/api/post.api";

interface PostCounts {
  all?: number;
  draft?: number;
  published?: number;
  archived?: number;
  deleted?: number;
  totalViews?: number;
}

const loading = ref(true);
const counts = ref<PostCounts>({});

const fetchCounts = async () => {
  try {
    const data = await getPostCounts();
    counts.value = (data?.counts as PostCounts) ?? {};
  } catch {
    counts.value = {};
  }
};

onMounted(async () => {
  loading.value = true;
  await fetchCounts();
  loading.value = false;
});
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
    <TotalVisitsCard :counts="counts" :loading="loading" />
    <PublishedPostsCard :counts="counts" :loading="loading" />
    <UnreadEmailsCard />
    <PendingFriendLinksCard />
  </div>
</template>
