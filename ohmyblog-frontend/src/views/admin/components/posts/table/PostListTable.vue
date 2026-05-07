<!-- src/views/admin/components/posts/table/PostListTable.vue -->
<script setup lang="ts">
import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useLang } from "@/composables/lang.hook";
import BasePagination from "@/components/base/table/BasePagination.vue";
import EmptyState from "@/components/common/list/EmptyState.vue";
import BaseCheckbox from "@/components/base/table/BaseCheckbox.vue";
import PostStatusBadge from "./cells/PostStatusBadge.vue";
import PostTimeCell from "./cells/PostTimeCell.vue";
import PostTagsCell from "./cells/PostTagsCell.vue";
import PostRowActions from "./cells/PostRowActions.vue";
import type { PostListItem } from "@/api/post.api";

const props = defineProps<{
  posts: PostListItem[];
  loading: boolean;
  total: number;
  page: number;
  pageSize?: number;
}>();

const emit = defineEmits<{
  "update:page": [value: number];
  refresh: [];
}>();

const selected = defineModel<string[]>("selected", { default: () => [] });

const { t } = useLang();
const router = useRouter();

const totalPages = computed(() =>
  Math.ceil(props.total / (props.pageSize ?? 10)),
);

// ─── 选择 ───────────────────────────────────────────────────────────────────

watch(
  () => props.posts,
  () => {
    selected.value = [];
  },
);

const isAllSelected = computed(
  () =>
    props.posts.length > 0 &&
    props.posts.every((p) => selected.value.includes(p.uuid)),
);

const isPartiallySelected = computed(
  () => selected.value.length > 0 && !isAllSelected.value,
);

const toggleSelectAll = (val: boolean) => {
  selected.value = val ? props.posts.map((p) => p.uuid) : [];
};

const toggleSelect = (val: boolean, uuid: string) => {
  if (val) {
    if (!selected.value.includes(uuid))
      selected.value = [...selected.value, uuid];
  } else {
    selected.value = selected.value.filter((id) => id !== uuid);
  }
};

// ─── 操作 ───────────────────────────────────────────────────────────────────

const handleEdit = (uuid: string) => {
  router.push({ name: "post-edit", params: { uuid } });
};
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0">
    <!-- 列头 -->
    <div
      class="flex items-center px-5 py-2.5 border-b border-border/30 text-xs font-semibold text-fg-muted uppercase tracking-wider select-none"
    >
      <div class="w-10 shrink-0">
        <BaseCheckbox
          :model-value="isAllSelected"
          :indeterminate="isPartiallySelected"
          @update:model-value="toggleSelectAll"
        />
      </div>
      <div class="flex-1 min-w-0">
        {{ t("views.admin.Posts.table.col.post") }}
      </div>
      <div class="w-24 shrink-0 text-center">
        {{ t("views.admin.Posts.table.col.status") }}
      </div>
      <div class="w-36 shrink-0 pl-1.5">
        {{ t("views.admin.Posts.table.col.tags") }}
      </div>
      <div class="w-24 shrink-0 text-center">
        {{ t("views.admin.Posts.table.col.views") }}
      </div>
      <div class="w-32 shrink-0">
        {{ t("views.admin.Posts.table.col.time") }}
      </div>
      <div class="w-20 shrink-0 text-right">
        {{ t("views.admin.Posts.table.col.actions") }}
      </div>
    </div>

    <!-- 主体 -->
    <div class="flex-1 overflow-y-auto">
      <!-- 空态 -->
      <div v-if="posts.length === 0 && !loading" class="p-8">
        <EmptyState :text="t('views.admin.Posts.table.empty')" />
      </div>

      <!-- 数据行 -->
      <template v-if="posts.length > 0">
        <div
          v-for="post in posts"
          :key="post.uuid"
          class="group flex items-center px-5 py-3 border-b border-border/20 hover:bg-bg-muted/40 transition-colors duration-100 cursor-pointer"
          @click="handleEdit(post.uuid)"
        >
          <!-- 选择框 -->
          <div
            class="w-10 shrink-0 self-stretch flex items-center cursor-pointer"
            @click.stop="toggleSelect(!selected.includes(post.uuid), post.uuid)"
          >
            <BaseCheckbox
              :model-value="selected.includes(post.uuid)"
              @update:model-value="(val) => toggleSelect(val, post.uuid)"
            />
          </div>

          <!-- 文章信息 -->
          <div class="flex-1 min-w-0 pr-4">
            <p class="text-sm font-bold text-fg truncate leading-snug">
              {{ post.title || t("views.admin.Posts.table.untitled") }}
            </p>
            <p class="text-xs text-fg-subtle truncate mt-0.5 leading-relaxed">
              /{{ post.slug || "new-post" }}
            </p>
          </div>

          <!-- 状态 -->
          <div class="w-24 shrink-0 flex items-center justify-center">
            <PostStatusBadge :status="post.status" />
          </div>

          <!-- 标签 -->
          <PostTagsCell :tags="post.tags" />

          <!-- 观看人数 -->
          <div class="w-24 shrink-0 text-xs text-fg-muted text-center">
            {{ post.viewCount.toLocaleString() }}
          </div>

          <!-- 时间 -->
          <PostTimeCell :post="post" />

          <!-- 操作：弹窗逻辑由 PostRowActions 内部处理 -->
          <PostRowActions
            :post="post"
            @edit="handleEdit(post.uuid)"
            @refresh="emit('refresh')"
          />
        </div>
      </template>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="px-5 py-3 border-t border-border/30">
      <BasePagination
        :current-page="page"
        :total-pages="totalPages"
        @update:current-page="emit('update:page', $event)"
      />
    </div>
  </div>
</template>
