<!-- src/views/main/pages/Home.page.vue -->
<!-- TODO: 后续考虑是否将 main 改为嵌套路由结构（类似 admin），使用 /main 作为父路由，home 等页面作为子路由 -->
<script lang="ts" setup>
import MainLayout from "../components/MainLayout.vue";
</script>

<template>
  <MainLayout>
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold">Welcome to OhMyBlog</h1>
    </div>
  </MainLayout>
</template>
