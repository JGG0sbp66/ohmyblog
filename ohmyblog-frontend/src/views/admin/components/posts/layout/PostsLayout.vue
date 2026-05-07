<!-- src/views/admin/components/posts/layout/PostsLayout.vue -->
<script setup lang="ts">
import PostsNav from "./PostsNav.vue";
</script>

<template>
  <!-- Teleport 到 AdminHeader 的中间区域 -->
  <Teleport defer to="#admin-header-center">
    <PostsNav class="onload-animation" />
  </Teleport>

  <!-- 子路由内容区 -->
  <router-view />
</template>
