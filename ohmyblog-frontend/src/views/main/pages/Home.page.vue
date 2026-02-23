<!-- src/views/main/pages/Home.page.vue -->
<!-- TODO: 开发正式的首页内容，目前仅为占位符 -->
<!-- TODO: 后续考虑是否将 main 改为嵌套路由结构（类似 admin），使用 /main 作为父路由，home 等页面作为子路由 -->
<script lang="ts" setup>
import MainLayout from "../components/MainLayout.vue";
</script>

<template>
  <MainLayout>
    <div class="flex items-center justify-center min-h-[50vh]">
      <h1 class="text-4xl font-bold opacity-20 select-none">
        这里是home页面占位符，正在开发中
      </h1>
    </div>
  </MainLayout>
</template>
