<!--
  src/views/admin/components/posts/table/toolbar/PostSearchModal.vue
  移动端文章搜索弹窗：输入框 + 结果列表同屏显示。
  - query 双向绑定驱动父组件拉取；posts/loading 由父组件传入。
  - 点击结果项 emit('select', uuid)，由父组件跳转编辑并关闭弹窗。
-->
<script setup lang="ts">
import { useLang } from "@/composables/lang.hook";
import BaseModal from "@/components/base/pop/BaseModal.vue";
import SearchInput from "@/components/common/input/SearchInput.vue";
import Loading from "@/components/common/item/Loading.vue";
import EmptyState from "@/components/common/list/EmptyState.vue";
import PostStatusBadge from "../cells/PostStatusBadge.vue";
import type { PostListItem } from "@/api/post.api";

const props = defineProps<{
  /** 弹窗开关（v-model） */
  modelValue: boolean;
  /** 搜索关键词（v-model:query） */
  query: string;
  /** 当前搜索结果，由父组件按 query 拉取 */
  posts: PostListItem[];
  /** 是否加载中 */
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "update:query", v: string): void;
  (e: "select", uuid: string): void;
}>();

const { t } = useLang();
</script>

<template>
  <BaseModal
    :model-value="props.modelValue"
    max-width="max-w-lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex flex-col gap-4 -my-2">
      <!-- 搜索输入（打开自动聚焦） -->
      <SearchInput
        :model-value="props.query"
        width="w-full"
        autofocus
        @update:model-value="emit('update:query', $event)"
      />

      <!-- 结果区域 -->
      <div class="max-h-[55vh] min-h-24 overflow-y-auto">
        <!-- 首次加载 -->
        <div
          v-if="props.loading && props.posts.length === 0"
          class="flex items-center justify-center py-10"
        >
          <Loading size-class="w-5 h-5" color-class="text-fg-subtle" />
        </div>

        <!-- 有结果 -->
        <template v-else-if="props.posts.length > 0">
          <button
            v-for="post in props.posts"
            :key="post.uuid"
            type="button"
            class="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left cursor-pointer hover:bg-bg-muted/50"
            @click="emit('select', post.uuid)"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-fg truncate">
                {{ post.title || t("views.admin.Posts.table.untitled") }}
              </p>
              <p class="text-xs text-fg-subtle truncate">
                /{{ post.slug || "new-post" }}
              </p>
            </div>
            <PostStatusBadge :status="post.status" />
          </button>
        </template>

        <!-- 空态 -->
        <div v-else class="py-8">
          <EmptyState :text="t('views.admin.Posts.table.empty')" />
        </div>
      </div>
    </div>
  </BaseModal>
</template>
