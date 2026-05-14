<!-- src/views/main/components/friends/FriendLinkLayout.vue -->
<!--
  友链列表布局组件。
  两列网格展示已通过的友链卡片列表，超过一页时显示分页器；无数据时显示空状态。
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import { Users } from "lucide-vue-next";
import FriendLinkCard from "./FriendLinkCard.vue";
import EmptyState from "@/components/common/list/EmptyState.vue";
import BasePagination from "@/components/base/table/BasePagination.vue";
import { useLang } from "@/composables/lang.hook";
import type { FriendLinkItem } from "@/api/friend-link.api";

const { t } = useLang();

const PAGE_SIZE = 8;

const props = defineProps<{
  links: FriendLinkItem[];
}>();

const page = ref(1);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.links.length / PAGE_SIZE)),
);

const pagedLinks = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return props.links.slice(start, start + PAGE_SIZE);
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <EmptyState
      v-if="links.length === 0"
      :text="t('views.main.friends.listEmpty')"
    >
      <template #icon>
        <Users class="w-8 h-8" />
      </template>
    </EmptyState>

    <template v-else>
      <div class="columns-1 sm:columns-2 gap-3 stagger-container">
        <div
          v-for="link in pagedLinks"
          :key="link.uuid"
          class="break-inside-avoid mb-3 onload-animation"
        >
          <FriendLinkCard :link="link" />
        </div>
      </div>

      <div class="flex justify-center">
        <BasePagination
          :current-page="page"
          :total-pages="totalPages"
          @update:current-page="page = $event"
        />
      </div>
    </template>
  </div>
</template>
