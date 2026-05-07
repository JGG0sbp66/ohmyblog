<!-- src/components/base/table/BasePagination.vue -->
<script setup lang="ts">
import { computed } from "vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

const props = defineProps<{
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  "update:currentPage": [value: number];
}>();

// 统一的跳页入口：超出边界或点击当前页时直接忽略。
const goTo = (page: number) => {
  if (page < 1 || page > props.totalPages || page === props.currentPage) {
    return;
  }
  emit("update:currentPage", page);
};

// 生成可渲染的页码序列：
// - 少页数时全部展开
// - 多页数时固定为 7 个槽位（首尾 + 中段 + 省略号）
const pages = computed<(number | string)[]>(() => {
  const list: (number | string)[] = [];
  const total = props.totalPages;
  const current = props.currentPage;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      list.push(i);
    }
    return list;
  }

  // 起始区：1 2 3 4 5 ... N
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }

  // 末尾区：1 ... N-4 N-3 N-2 N-1 N
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }

  // 中间区：1 ... P-1 P P+1 ... N
  return [1, "...", current - 1, current, current + 1, "...", total];
});
</script>

<template>
  <!-- 仅在需要分页时显示 -->
  <div v-if="totalPages > 1" class="flex items-center justify-end gap-1.5">
    <!-- 上一页 -->
    <ButtonSecondary
      :disabled="currentPage <= 1"
      class="w-10! h-10! p-0! rounded-full! text-fg-subtle!"
      @click="goTo(currentPage - 1)"
      aria-label="上一页"
    >
      <ChevronLeft class="w-5 h-5" />
    </ButtonSecondary>

    <template v-for="(page, index) in pages" :key="`page-${index}-${page}`">
      <!-- 数字页码 -->
      <ButtonSecondary
        v-if="typeof page === 'number'"
        :is-active="page === currentPage"
        :text="String(page)"
        class="w-10! h-10! p-0! rounded-full! text-sm font-medium"
        @click="goTo(page)"
      />
      <!-- 省略号占位 -->
      <span
        v-else
        class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-fg-soft"
      >
        ...
      </span>
    </template>

    <!-- 下一页 -->
    <ButtonSecondary
      :disabled="currentPage >= totalPages"
      class="w-10! h-10! p-0! rounded-full! text-fg-subtle!"
      @click="goTo(currentPage + 1)"
      aria-label="下一页"
    >
      <ChevronRight class="w-5 h-5" />
    </ButtonSecondary>
  </div>
</template>
