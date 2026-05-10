<!-- src/views/main/pages/Home.page.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useLang } from "@/composables/lang.hook";
import { getPublicPostList } from "@/api/post.api";
import type { PostListItem } from "@/api/post.api";
import PostCard from "@/views/main/components/PostCard.vue";
import EmptyState from "@/components/common/list/EmptyState.vue";
import BasePagination from "@/components/base/table/BasePagination.vue";

const { t } = useLang();

const PAGE_SIZE = 5;

const posts = ref<PostListItem[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

const fetchList = async () => {
  loading.value = true;
  try {
    const data = await getPublicPostList({ page: page.value, pageSize: PAGE_SIZE });
    if (data) {
      posts.value = data.list ?? [];
      total.value = data.total ?? 0;
    }
  } catch {
  } finally {
    loading.value = false;
  }
};

const onPageChange = (target: number) => {
  page.value = target;
  fetchList();
};

onMounted(fetchList);
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 首次加载骨架（列表为空时才显示，避免翻页时高度跳变） -->
    <template v-if="loading && posts.length === 0">
      <div class="flex flex-col gap-4">
        <div
          v-for="i in PAGE_SIZE"
          :key="i"
          class="h-28 rounded-2xl bg-bg-card animate-pulse"
        />
      </div>
    </template>

    <!-- 列表区域：翻页时保持可见，用透明度表示加载中 -->
    <template v-else>
      <!-- 空状态 -->
      <EmptyState
        v-if="posts.length === 0"
        class="mt-32"
        :text="t('views.main.home.PostCard.empty')"
      />

      <!-- 卡片列表 -->
      <div
        v-else
        :class="['flex flex-col gap-4 stagger-container transition-opacity duration-200 [--content-delay:0ms]', loading ? 'opacity-50 pointer-events-none' : '']"
      >
        <div
          v-for="post in posts"
          :key="post.uuid"
          class="onload-animation"
        >
          <PostCard :post="post" />
        </div>
      </div>
    </template>

    <!-- 翻页（居中） -->
    <div class="flex justify-center mt-2">
      <BasePagination
        :current-page="page"
        :total-pages="totalPages"
        @update:current-page="onPageChange"
      />
    </div>
  </div>
</template>
