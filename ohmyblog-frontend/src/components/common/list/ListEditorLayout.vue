<!-- 
  src/components/common/list/ListEditorLayout.vue 
  通用的列表编辑器外壳组件，统一管理标题、计数统计、添加按钮、内容区域及分页。
-->
<script setup lang="ts">
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import BasePagination from "@/components/base/table/BasePagination.vue";
import { RiAddLine } from "@remixicon/vue";
import EmptyState from "@/components/common/list/EmptyState.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

defineProps<{
  /** 模块标题 */
  title: string;
  /** 当前项总数 */
  count: number;
  /** 添加按钮的文字 */
  addText?: string;
  /** 是否显示分页 */
  showPagination?: boolean;
  /** 当前页码 (用于分页) */
  currentPage?: number;
  /** 总页数 (用于分页) */
  totalPages?: number;
}>();

const emit = defineEmits<{
  /** 点击添加按钮 */
  (e: "add"): void;
  /** 更新页码 */
  (e: "update:currentPage", page: number): void;
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 头部：标题、计数、操作按钮 -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-bold tracking-wider text-fg-subtle uppercase">
          {{ title }}
        </h3>
        <BaseTag v-if="count > 0" type="info" size="sm" class="px-2!">
          {{ t("common.list.count", { count }) }}
        </BaseTag>
      </div>

      <!-- 添加按钮 -->
      <ButtonSecondary
        :text="addText"
        class="group/addbtn shrink-0"
        size="sm"
        @click="$emit('add')"
      >
        <RiAddLine
          class="w-5 h-5 transition-transform duration-300 group-hover/addbtn:rotate-90"
        />
      </ButtonSecondary>
    </div>

    <!-- 内容区域 (带淡入淡出动画切换) -->
    <div class="relative">
      <Transition name="fade-list" mode="out-in">
        <div :key="count === 0 ? 'empty' : 'content'">
          <slot v-if="count > 0" />
          <slot v-else name="empty">
            <EmptyState />
          </slot>
        </div>
      </Transition>
    </div>

    <!-- 底部：分页或其他操作 -->
    <div v-if="showPagination" class="pt-2">
      <slot name="footer">
        <BasePagination
          v-if="currentPage !== undefined && totalPages !== undefined"
          :current-page="currentPage"
          :total-pages="totalPages"
          @update:currentPage="emit('update:currentPage', $event)"
        />
      </slot>
    </div>
  </div>
</template>

<style scoped>
/* 状态切换动画 (Empty <-> Content) */
.fade-list-enter-active,
.fade-list-leave-active {
  transition:
    opacity 0.2s ease-out,
    transform 0.2s ease-out;
}

.fade-list-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-list-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
