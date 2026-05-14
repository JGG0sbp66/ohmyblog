<!-- src/views/admin/pages/posts/PostList.page.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useDebounceFn } from "@vueuse/core";
import BaseCard from "@/components/base/card/BaseCard.vue";
import PostListFilter from "@/views/admin/components/posts/table/toolbar/PostListFilter.vue";
import type { PostStatusFilter } from "@/views/admin/components/posts/table/toolbar/PostListFilter.vue";
import PostBulkStatusButton from "@/views/admin/components/posts/table/toolbar/PostBulkStatusButton.vue";
import PostBulkDeleteButton from "@/views/admin/components/posts/table/toolbar/PostBulkDeleteButton.vue";
import SearchInput from "@/components/common/input/SearchInput.vue";
import { getPostList, getPostCounts } from "@/api/post.api";
import type { PostListItem } from "@/api/post.api";
import PostListTable from "@/views/admin/components/posts/table/PostListTable.vue";
import PageToolbar from "@/views/admin/components/posts/layout/PageToolbar.vue";

const activeFilter = ref<PostStatusFilter>(null);
const searchQuery = ref("");
const pageSize = 10;

const counts = ref<{
  all?: number;
  draft?: number;
  published?: number;
  archived?: number;
  deleted?: number;
  totalViews?: number;
}>({ all: 0, draft: 0, published: 0, archived: 0, deleted: 0 });
const posts = ref<PostListItem[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const selectedUuids = ref<string[]>([]);

const selectedPosts = computed(() =>
  posts.value.filter((p) => selectedUuids.value.includes(p.uuid)),
);

const fetchCounts = async () => {
  try {
    const data = await getPostCounts();
    if (data?.counts) counts.value = data.counts;
  } catch {}
};

const fetchList = async () => {
  loading.value = true;
  try {
    const data = await getPostList({
      page: page.value,
      pageSize,
      ...(activeFilter.value ? { status: activeFilter.value } : {}),
      ...(searchQuery.value ? { search: searchQuery.value } : {}),
    });
    if (data) {
      posts.value = data.list ?? [];
      total.value = data.total ?? 0;

      const totalPages = Math.max(1, Math.ceil(total.value / pageSize));
      if (page.value > totalPages) {
        page.value = totalPages;
        await fetchList();
        return;
      }
    }
  } catch {
  } finally {
    loading.value = false;
  }
};

const debouncedFetchList = useDebounceFn(fetchList, 300);

// filter 切换立即刷新
watch(activeFilter, () => {
  page.value = 1;
  fetchList();
});

// search 防抖刷新
watch(searchQuery, () => {
  page.value = 1;
  debouncedFetchList();
});

onMounted(() => {
  fetchCounts();
  fetchList();
});

/** 供父组件触发手动刷新（如新增草稿后） */
defineExpose({
  refresh: () => {
    fetchCounts();
    fetchList();
  },
});
</script>

<template>
  <BaseCard
    padding="none"
    class="flex-1 flex flex-col overflow-hidden onload-animation"
  >
    <!-- 操作区域 -->
    <PageToolbar class="onload-animation anim-delay-100">
      <template #left>
        <!-- 分类过滤 -->
        <PostListFilter v-model="activeFilter" :counts="counts" />
      </template>
      <template #right>
        <!-- 批量操作 + 搜索框 -->
        <div class="flex items-center gap-2">
          <Transition name="bulk-fade">
            <div
              v-if="selectedUuids.length > 0"
              class="flex items-center gap-2"
            >
              <PostBulkStatusButton
                :selected-posts="selectedPosts"
                @refresh="
                  fetchCounts();
                  fetchList();
                "
              />
              <PostBulkDeleteButton
                :selected-posts="selectedPosts"
                @refresh="
                  fetchCounts();
                  fetchList();
                "
              />
            </div>
          </Transition>
          <!-- 搜索框（与 filter 按钮自然居中对齐） -->
          <SearchInput v-model="searchQuery" />
        </div>
      </template>
    </PageToolbar>

    <PostListTable
      class="onload-animation anim-delay-150"
      :posts="posts"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      v-model:selected="selectedUuids"
      @update:page="
        page = $event;
        fetchList();
      "
      @refresh="
        fetchCounts();
        fetchList();
      "
    />
  </BaseCard>
</template>

<style scoped>
.bulk-fade-enter-active,
.bulk-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bulk-fade-enter-from,
.bulk-fade-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
  filter: blur(4px);
}
</style>
