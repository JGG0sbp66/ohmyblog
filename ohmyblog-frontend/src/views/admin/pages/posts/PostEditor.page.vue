<!-- src/views/admin/pages/PostEditor.page.vue -->
<!-- TODO: 实现文章编辑器 -->
<script setup lang="ts">
import { useRoute } from "vue-router";
import BaseCard from "@/components/base/card/BaseCard.vue";

const route = useRoute();
</script>

<template>
  <BaseCard padding="none" class="flex-1 flex flex-col overflow-hidden">
    <!-- 顶部操作栏 -->
    <div
      class="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40"
    >
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold text-fg">
          {{ route.params.uuid ? "编辑文章" : "写文章" }}
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <!-- 按钮区域 -->
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- 编辑器主体 -->
      </div>
    </div>
  </BaseCard>
</template>
