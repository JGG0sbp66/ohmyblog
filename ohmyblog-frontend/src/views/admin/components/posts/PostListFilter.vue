<!-- src/views/admin/components/posts/PostListFilter.vue -->
<script setup lang="ts">
import { computed } from "vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useLang } from "@/composables/lang.hook";
import type { TPostStatus } from "@server/db/constants/post.constants";

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

const badgeColorMap: Record<string, string> = {
  null:      "bg-accent/15 text-accent",
  published: "bg-blue-500/15 text-blue-500",
  draft:     "bg-amber-400/20 text-amber-500",
  archived:  "bg-purple-500/15 text-purple-500",
  deleted:   "bg-red-500/15 text-red-500",
};

const items = computed(() => [
  { key: null as PostStatusFilter,        label: t("views.admin.Posts.filter.all"),       count: props.counts.all       },
  { key: "published" as PostStatusFilter, label: t("views.admin.Posts.filter.published"), count: props.counts.published },
  { key: "draft" as PostStatusFilter,     label: t("views.admin.Posts.filter.draft"),     count: props.counts.draft     },
  { key: "archived" as PostStatusFilter,  label: t("views.admin.Posts.filter.archived"),  count: props.counts.archived  },
  { key: "deleted" as PostStatusFilter,   label: t("views.admin.Posts.filter.deleted"),   count: props.counts.deleted   },
]);

const badgeClass = (key: PostStatusFilter) =>
  badgeColorMap[String(key)] ?? "bg-accent/15 text-accent";
</script>

<template>
  <!-- items-end：让每个 tab 的 indicator 线与容器 border-b 底边对齐 -->
  <div class="flex items-end gap-1">
    <div
      v-for="item in items"
      :key="String(item.key)"
      class="flex flex-col items-stretch"
    >
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
            :class="modelValue === item.key ? 'max-w-8 ml-1.5 opacity-100' : 'max-w-0 ml-0 opacity-0'"
          >
            <span :class="['text-[10px] py-0.5 px-1.5 rounded-full font-medium tabular-nums whitespace-nowrap', badgeClass(item.key)]">
              {{ item.count }}
            </span>
          </span>
        </span>
      </ButtonSecondary>

      <!-- indicator 线：与按钮之间保留 gap，-mb-px 与容器 border-b 重叠 -->
      <div
        class="h-0.75 mx-1 mt-1.5 -mb-px rounded-t-sm transition-colors duration-200"
        :class="modelValue === item.key ? 'bg-accent' : 'bg-transparent'"
      />
    </div>
  </div>
</template>
