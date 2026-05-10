<script setup lang="ts">
/**
 * 最近文章卡片
 * 直接复用 PostList.page.vue 页面组件
 */
import { ref } from "vue";
import PostListPage from "@/views/admin/pages/posts/PostList.page.vue";

const postListRef = ref<InstanceType<typeof PostListPage> | null>(null);

const refresh = () => postListRef.value?.refresh();

defineExpose({ refresh });
</script>

<template>
  <PostListPage ref="postListRef" />
</template>
