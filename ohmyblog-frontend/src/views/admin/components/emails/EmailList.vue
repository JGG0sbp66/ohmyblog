<!-- 
  src/views/admin/components/emails/EmailList.vue 
  邮件列表容器组件
  - 负责拉取数据、分页、无限滚动
  - 循环渲染 EmailListCard
-->
<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useInfiniteScroll } from "@vueuse/core";
import { getEmailLogs } from "@/api/email.api";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import EmailListCard from "./EmailListCard.vue";
import type { EmailLogItem, EmailLogFilters } from "./types";

const props = defineProps<{
  filters: EmailLogFilters;
  modelValue?: EmailLogItem | null; // 当前选中的项
}>();

const emit = defineEmits<{
  "update:modelValue": [item: EmailLogItem | null];
  "select": [item: EmailLogItem];
}>();

const { t } = useLang();

// 分页配置
const PAGE_SIZE = 20;

// 列表数据与加载控制
const list = ref<EmailLogItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const isLoading = ref(false);
const isFinished = ref(false);

const scrollContainer = ref<HTMLElement | null>(null);

/**
 * 拉取列表
 * @param reset 是否重置列表（用于过滤条件变化时）
 */
const fetchList = async (reset = false) => {
  if (isLoading.value || (isFinished.value && !reset)) return;
  
  isLoading.value = true;
  if (reset) {
    currentPage.value = 1;
    isFinished.value = false;
  }

  try {
    const res = await getEmailLogs({
      page: currentPage.value,
      pageSize: PAGE_SIZE,
      type: props.filters.type,
      isRead: props.filters.isRead,
    });
    
    const newList = (res?.list ?? []) as EmailLogItem[];
    
    if (reset) {
      list.value = newList;
    } else {
      list.value.push(...newList);
    }
    
    total.value = res?.total ?? 0;
    
    if (list.value.length >= total.value || newList.length < PAGE_SIZE) {
      isFinished.value = true;
    } else {
      currentPage.value++;
    }
    
    // 如果没有选中项且列表不为空，默认选中第一项
    if (!props.modelValue && list.value.length > 0) {
      emit("update:modelValue", list.value[0] || null);
    }
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isLoading.value = false;
  }
};

// 注册无限滚动
useInfiniteScroll(
  scrollContainer,
  () => {
    if (!isFinished.value && !isLoading.value) {
      fetchList();
    }
  },
  { distance: 50 }
);

// 监听过滤条件变化
watch(
  () => props.filters,
  () => fetchList(true),
  { deep: true }
);

const handleSelect = (item: EmailLogItem) => {
  emit("update:modelValue", item);
  emit("select", item);
};

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div 
    ref="scrollContainer"
    class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
  >
    <EmailListCard
      v-for="item in list"
      :key="item.uuid"
      :item="item"
      :active="modelValue?.uuid === item.uuid"
      class="w-full"
      @click="handleSelect(item)"
    />

    <!-- 加载状态指示器 -->
    <div v-if="isLoading" class="flex flex-col gap-2">
      <div v-for="i in (list.length === 0 ? 5 : 1)" :key="i" class="h-28 bg-bg-muted-soft animate-pulse shrink-0 border-b border-fg-muted/10"></div>
    </div>

    <!-- 加载完毕提示 -->
    <div v-if="isFinished && list.length > 0" class="py-4 text-center">
      <span class="text-[10px] font-bold uppercase tracking-widest text-fg-subtle/30">
        {{ t('common.no_more_data') }}
      </span>
    </div>
    
    <div v-if="!isLoading && list.length === 0" class="h-full flex flex-col items-center justify-center p-8 opacity-40">
       <div class="text-sm font-bold">{{ t('common.no_data') }}</div>
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
