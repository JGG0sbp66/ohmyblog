<!-- src/views/admin/components/posts/table/toolbar/PostListFilter.vue -->
<script setup lang="ts">
import { computed } from "vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useLang } from "@/composables/lang.hook";
import type { TPostStatus } from "@server/db/constants/post.constants";
import {
  POST_STATUS_COLORS,
  POST_STATUS_LABEL_KEYS,
} from "../cells/PostStatusBadge.vue";

export type PostStatusFilter = TPostStatus | null;

interface CountMap {
  all: number;
  draft: number;
  published: number;
  archived: number;
  deleted: number;
}

const props = defineProps<{
  modelValue: PostStatusFilter;
  counts: CountMap;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: PostStatusFilter): void;
}>();

const { t } = useLang();

const items = computed(() => [
  {
    key: null as PostStatusFilter,
    label: t("views.admin.Posts.filter.all"),
    count: props.counts.all,
  },
  {
    key: "published" as PostStatusFilter,
    label: t(POST_STATUS_LABEL_KEYS.published),
    count: props.counts.published,
  },
  {
    key: "draft" as PostStatusFilter,
    label: t(POST_STATUS_LABEL_KEYS.draft),
    count: props.counts.draft,
  },
  {
    key: "archived" as PostStatusFilter,
    label: t(POST_STATUS_LABEL_KEYS.archived),
    count: props.counts.archived,
  },
  {
    key: "deleted" as PostStatusFilter,
    label: t(POST_STATUS_LABEL_KEYS.deleted),
    count: props.counts.deleted,
  },
]);

const badgeClass = (key: PostStatusFilter) => POST_STATUS_COLORS[key ?? "all"];
</script>

<template>
  <!-- 外层 items-center 让按钮与 SearchInput 自然对齐 -->
  <div class="flex items-center gap-1">
    <div v-for="item in items" :key="String(item.key)" class="relative">
      <ButtonSecondary
        :isActive="modelValue === item.key"
        class="h-10 px-4"
        @click="emit('update:modelValue', item.key)"
      >
        <!-- max-width + margin-left 同步过渡：无 gap 残留；inline-flex 保证垂直居中 -->
        <span class="flex items-center text-sm">
          <span>{{ item.label }}</span>
          <span
            class="inline-flex items-center overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            :class="
              modelValue === item.key
                ? 'max-w-8 ml-1.5 opacity-100'
                : 'max-w-0 ml-0 opacity-0'
            "
          >
            <span
              :class="[
                'text-[10px] py-0.5 px-1.5 rounded-full font-medium tabular-nums whitespace-nowrap',
                badgeClass(item.key),
              ]"
            >
              {{ item.count }}
            </span>
          </span>
        </span>
      </ButtonSecondary>

      <!-- indicator 绝对定位至容器底部，不影响按钮高度，也不影响兄弟元素布局 -->
      <div
        class="absolute -bottom-3 left-1 right-1 h-0.75 rounded-t-sm transition-colors duration-200"
        :class="modelValue === item.key ? 'bg-accent' : 'bg-transparent'"
      />
    </div>
  </div>
</template>
