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
  <!-- :key 按 fullPath 强制换 uuid 时重建组件。post-edit 是单一路由记录，编辑 A 篇时
       点「写文章」跳到 B 篇会复用组件实例，usePostEditor 在 setup 时捕获的 uuid 不变，
       页面显示旧文章、自动保存却 PATCH 到旧 uuid —— 必须整个重挂载才能换掉这份状态 -->
  <router-view :key="$route.fullPath" />
</template>
