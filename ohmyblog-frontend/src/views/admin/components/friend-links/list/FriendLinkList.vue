<!--
  src/views/admin/components/friend-links/list/FriendLinkList.vue
  友链列表容器组件
  - 负责拉取数据、无限滚动
  - 循环渲染 FriendLinkListCard
  - 暴露 refresh() 供父组件在操作后强制刷新
-->
<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { useLang } from "@/composables/lang.hook";
import { useFriendLinkList } from "@/composables/friend-link-list.hook";
import FriendLinkListCard from "./FriendLinkListCard.vue";
import type { FriendLinkItem, FriendLinkFilters } from "../types";

const props = defineProps<{
  filters: FriendLinkFilters;
  modelValue?: FriendLinkItem | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [item: FriendLinkItem | null];
}>();

const { t } = useLang();

const scrollContainer = ref<HTMLElement | null>(null);

const { list, isLoading, isFinished, fetchList } = useFriendLinkList(
  () => props.filters,
  scrollContainer,
  {
    onFetch() {
      // 首次加载且无选中项时，默认选中第一项
      if (!props.modelValue && list.value.length > 0) {
        emit("update:modelValue", list.value[0] ?? null);
      }
    },
  },
);

// ── 选中项定位滚动 ─────────────────────────────────────────────────────────────

// 记录已滚动过的 uuid，防止无限滚动追加数据时重复触发
const scrolledToUuid = ref<string | null>(null);

watch([() => props.modelValue?.uuid, () => list.value.length], ([uuid]) => {
  if (!uuid || uuid === scrolledToUuid.value) return;
  const found = list.value.some((i) => i.uuid === uuid);
  if (found) {
    scrolledToUuid.value = uuid;
    nextTick(() => {
      scrollContainer.value
        ?.querySelector(`[data-uuid="${uuid}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
});

onMounted(() => fetchList(true));

/** 暴露给父组件，操作（审批/删除）完成后强制刷新 */
const refresh = () => fetchList(true);
defineExpose({ refresh });
</script>

<template>
  <div
    ref="scrollContainer"
    class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
  >
    <TransitionGroup name="list-item-anim">
      <FriendLinkListCard
        v-for="item in list"
        :key="item.uuid"
        :data-uuid="item.uuid"
        :item="item"
        :active="modelValue?.uuid === item.uuid"
        class="w-full"
        @click="emit('update:modelValue', item)"
      />
    </TransitionGroup>

    <!-- 加载状态：列表为空时显示 5 行，追加时显示 1 行 -->
    <div v-if="isLoading" class="flex flex-col gap-2">
      <div
        v-for="i in list.length === 0 ? 5 : 1"
        :key="i"
        class="h-20 bg-bg-muted-soft animate-pulse shrink-0 border-b border-fg-muted/10"
      />
    </div>

    <!-- 加载完毕提示 -->
    <div v-if="isFinished && list.length > 0" class="py-4 text-center">
      <span class="text-[10px] font-bold uppercase tracking-widest text-fg-subtle/30">
        {{ t("common.no_more_data") }}
      </span>
    </div>

    <!-- 空状态 -->
    <div
      v-if="!isLoading && list.length === 0"
      class="h-full flex flex-col items-center justify-center p-8 opacity-40"
    >
      <div class="text-sm font-bold">{{ t("common.no_data") }}</div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: none; /* Firefox */
}
.custom-scrollbar::-webkit-scrollbar {
  width: 0; /* Chrome / Safari / Edge */
}
</style>
