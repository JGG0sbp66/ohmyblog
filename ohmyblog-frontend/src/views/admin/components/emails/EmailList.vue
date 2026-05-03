<!-- 
  src/views/admin/components/emails/EmailList.vue 
  邮件列表容器组件
  - 负责拉取数据、分页、无限滚动
  - 循环渲染 EmailListCard
-->
<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import { useLang } from "@/composables/lang.hook";
import { useEmailLogList } from "@/composables/email-log-list.hook";
import EmailListCard from "./EmailListCard.vue";
import type { EmailLogItem, EmailLogFilters } from "./types";

const props = defineProps<{
  filters: EmailLogFilters;
  modelValue?: EmailLogItem | null; // 当前选中的项
}>();

const emit = defineEmits<{
  "update:modelValue": [item: EmailLogItem | null];
  select: [item: EmailLogItem];
}>();

const { t } = useLang();

const scrollContainer = ref<HTMLElement | null>(null);

const { list, isLoading, isFinished, fetchList } = useEmailLogList(
  () => props.filters,
  scrollContainer,
  {
    onFetch() {
      // 首次加载且没有选中项时，默认选中第一项
      if (!props.modelValue && list.value.length > 0) {
        emit("update:modelValue", list.value[0] ?? null);
      }
    },
  },
);

// 记录已经滚动过的 uuid，防止在同一项被选中时，因为无限滚动追加数据而重复触发平滑滚动
const scrolledToUuid = ref<string | null>(null);

/**
 * 核心定位逻辑：
 * 监听【选中项ID】和【列表长度】。
 * 当目标项出现在列表中时，立即执行平滑滚动定位。
 */
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

// 自动翻页逻辑：当外部传入一个不在当前列表中的 uuid 时，自动加载后续页面直到找到该项
const targetUuid = ref<string | null>(null);

const checkAndLoadMore = () => {
  const uuid = targetUuid.value;
  if (!uuid) return;

  // 如果已在列表中，停止加载
  if (list.value.some((i) => i.uuid === uuid)) {
    targetUuid.value = null;
    return;
  }

  // 否则继续静默加载下一页
  if (!isFinished.value && !isLoading.value) fetchList();
};

// 监听外部传入的 uuid 变化
watch(
  () => props.modelValue?.uuid,
  (uuid) => {
    targetUuid.value = uuid ?? null;
    checkAndLoadMore();
  },
);

// 每一页加载完成后，继续检查是否需要加载下一页
watch(isLoading, (loading) => {
  if (!loading) checkAndLoadMore();
});

const handleSelect = (item: EmailLogItem) => {
  emit("update:modelValue", item);
  emit("select", item);
};

onMounted(() => fetchList(true));
</script>

<template>
  <div
    ref="scrollContainer"
    class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
  >
    <EmailListCard
      v-for="item in list"
      :key="item.uuid"
      :data-uuid="item.uuid"
      :item="item"
      :active="modelValue?.uuid === item.uuid"
      class="w-full"
      @click="handleSelect(item)"
    />

    <!-- 加载状态指示器 -->
    <div v-if="isLoading" class="flex flex-col gap-2">
      <div
        v-for="i in list.length === 0 ? 5 : 1"
        :key="i"
        class="h-28 bg-bg-muted-soft animate-pulse shrink-0 border-b border-fg-muted/10"
      ></div>
    </div>

    <!-- 加载完毕提示 -->
    <div v-if="isFinished && list.length > 0" class="py-4 text-center">
      <span
        class="text-[10px] font-bold uppercase tracking-widest text-fg-subtle/30"
      >
        {{ t("common.no_more_data") }}
      </span>
    </div>

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
