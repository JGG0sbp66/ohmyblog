<!-- src/views/main/pages/Home.page.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useLang } from "@/composables/lang.hook";
import { getPublicPostList } from "@/api/post.api";
import type { PostListItem } from "@/api/post.api";
import PostCard from "@/views/main/components/post/PostCard.vue";
import BaseCard from "@/components/base/card/BaseCard.vue";
import EmptyState from "@/components/common/list/EmptyState.vue";
import BasePagination from "@/components/base/table/BasePagination.vue";

const { t } = useLang();

const PAGE_SIZE = 5;

const posts = ref<PostListItem[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / PAGE_SIZE)),
);

const fetchList = async () => {
  loading.value = true;
  try {
    const data = await getPublicPostList({
      page: page.value,
      pageSize: PAGE_SIZE,
    });
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
    <!-- 空状态 -->
    <BaseCard
      class="onload-animation"
      v-if="!loading && posts.length === 0"
      padding="default"
    >
      <EmptyState :text="t('views.main.home.PostCard.empty')" />
    </BaseCard>

    <!--
      卡片列表
      - 移动端：破出 main 的 px-4 让卡片贴边；用点状分割线在卡间做轻量分隔；
        整体 overflow-hidden + rounded-2xl 让首尾卡片四角圆角，与 Header 底部圆角呼应。
      - 桌面端：恢复 gap-4，去除分隔线和裁剪。
    -->
    <div
      v-else-if="posts.length > 0"
      :class="[
        'flex flex-col stagger-container transition-opacity duration-200 [--content-delay:0ms]',
        '-mx-4 md:mx-0 md:gap-4',
        'overflow-hidden rounded-2xl md:overflow-visible md:rounded-none',
        loading ? 'opacity-50 pointer-events-none' : '',
      ]"
    >
      <div
        v-for="post in posts"
        :key="post.uuid"
        class="post-card-item onload-animation"
      >
        <PostCard :post="post" />
      </div>
    </div>

    <!-- 翻页（居中） -->
    <div
      v-if="totalPages > 1 || posts.length > 0"
      class="flex justify-center mt-2"
    >
      <BasePagination
        :current-page="page"
        :total-pages="totalPages"
        @update:current-page="onPageChange"
      />
    </div>
  </div>
</template>

<style scoped>
@media (width < 48rem) {
  .post-card-item + .post-card-item {
    position: relative;
  }

  .post-card-item + .post-card-item::before {
    content: "";
    position: absolute;
    top: 0;
    left: 1rem;
    right: 1rem;
    z-index: 1;
    height: 1px;
    background-image: radial-gradient(
      circle,
      color-mix(in oklab, var(--color-fg-muted) 10%, transparent) 1px,
      transparent 1px
    );
    background-size: 4px 1px;
    background-repeat: repeat-x;
  }
}
</style>
