<!-- src/views/main/pages/Archive.page.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useLang } from "@/composables/lang.hook";
import { getPublicPostArchive } from "@/api/post.api";
import BaseCard from "@/components/base/card/BaseCard.vue";
import EmptyState from "@/components/common/list/EmptyState.vue";
import Loading from "@/components/common/item/Loading.vue";
import ArchiveYearGroup from "../components/archive/ArchiveYearGroup.vue";

const { t } = useLang();

interface ArchivePost {
  title: string;
  slug: string | null;
  publishedAt: Date | string | null;
  tags: string[];
}

interface YearGroup {
  year: number;
  posts: ArchivePost[];
}

const loading = ref(false);
const groups = ref<YearGroup[]>([]);

onMounted(async () => {
  loading.value = true;
  try {
    const data = await getPublicPostArchive();
    if (!data?.list) return;

    const grouped = (data.list as ArchivePost[]).reduce(
      (acc, post) => {
        const year = post.publishedAt
          ? new Date(post.publishedAt).getFullYear()
          : 0;
        if (!acc[year]) acc[year] = [];
        acc[year].push(post);
        return acc;
      },
      {} as Record<number, ArchivePost[]>,
    );

    groups.value = Object.entries(grouped)
      .map(([year, posts]) => ({ year: Number(year), posts }))
      .sort((a, b) => b.year - a.year);
  } catch {
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="onload-animation">
    <!-- 空状态 -->
    <BaseCard v-if="!loading && groups.length === 0" padding="default">
      <EmptyState :text="t('views.main.archive.empty')" />
    </BaseCard>

    <!-- 时间轴卡片 -->
    <div v-else class="-mx-4 md:mx-0">
      <BaseCard padding="none" class="px-8 py-6 rounded-2xl! md:rounded-3xl!">
        <!-- 加载中 -->
        <div v-if="loading" class="flex justify-center py-16">
          <Loading size-class="w-6 h-6" color-class="text-fg-subtle" />
        </div>

        <template v-else>
          <ArchiveYearGroup
            v-for="group in groups"
            :key="group.year"
            :year="group.year"
            :posts="group.posts"
          />
        </template>
      </BaseCard>
    </div>
  </div>
</template>
