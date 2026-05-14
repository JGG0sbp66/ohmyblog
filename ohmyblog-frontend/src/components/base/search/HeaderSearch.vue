<!-- src/components/base/search/HeaderSearch.vue -->
<!-- Header 搜索入口：hover 展开搜索栏 + 实时搜索下拉面板。逻辑见 header-search.hook.ts，列表项见 SearchResultItem.vue -->
<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { RiSearchLine } from "@remixicon/vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import BasePop from "@/components/base/pop/BasePop.vue";
import Loading from "@/components/common/item/Loading.vue";
import SearchResultItem from "./SearchResultItem.vue";
import { useHeaderSearch } from "@/composables/header-search.hook";

const { t } = useI18n();
const {
  containerRef,
  inputRef,
  scrollContainerRef,
  hovered,
  focused,
  isExpanded,
  isDropdownOpen,
  query,
  results,
  loading,
  onFocusOut,
  navigateTo,
  onKeydown,
} = useHeaderSearch();
</script>

<template>
  <div
    ref="containerRef"
    class="relative flex items-center h-11"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="onFocusOut"
  >
    <!-- 搜索栏 -->
    <div
      class="flex items-center h-11 overflow-hidden rounded-xl transition-[width] duration-300 ease-in-out"
      :class="
        isExpanded ? 'w-56 ring-1 ring-fg-subtle/20 bg-bg-muted/50' : 'w-11'
      "
    >
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        :placeholder="t('components.base.search.HeaderSearch.placeholder')"
        class="flex-1 min-w-0 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle/50 transition-[opacity,padding] duration-200"
        :class="
          isExpanded ? 'opacity-100 pl-3' : 'opacity-0 pl-0 pointer-events-none'
        "
        @keydown="onKeydown"
      />
      <!-- 点击图标聚焦输入框 -->
      <ButtonSecondary
        class="shrink-0 w-11! min-h-11!"
        @click="inputRef?.focus()"
      >
        <RiSearchLine class="w-4 h-4" />
      </ButtonSecondary>
    </div>

    <!-- 搜索结果面板, 点击外部关闭 -->
    <BasePop
      v-model="isDropdownOpen"
      :trigger-ref="containerRef"
      class="top-full mt-6 -right-14 w-72 overflow-hidden ring-1 ring-fg-subtle/10"
    >
      <!-- 初始加载中（还没有结果） -->
      <div
        v-if="loading && results.length === 0"
        class="flex items-center justify-center py-5"
      >
        <Loading size-class="w-4 h-4" color-class="text-fg-subtle" />
      </div>

      <!-- 结果列表（含底部加载更多） -->
      <div
        v-else-if="results.length > 0"
        ref="scrollContainerRef"
        class="search-results max-h-72 overflow-y-auto"
      >
        <SearchResultItem
          v-for="post in results"
          :key="post.uuid"
          :post="post"
          :query="query"
          @navigate="navigateTo"
        />
        <!-- 加载更多指示器 -->
        <div v-if="loading" class="flex justify-center py-3">
          <Loading size-class="w-3 h-3" color-class="text-fg-subtle" />
        </div>
      </div>

      <!-- 无结果 -->
      <div v-else class="flex items-center justify-center py-5">
        <span class="text-xs text-fg-muted">{{
          t("components.base.search.HeaderSearch.noResults")
        }}</span>
      </div>
    </BasePop>
  </div>
</template>

<style scoped>
.search-results {
  scrollbar-width: none;
}
.search-results::-webkit-scrollbar {
  width: 0;
}
</style>
