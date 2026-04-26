<!-- 
  src/views/main/components/hero/editors/title/subtitle/HeroSubtitleEditor.vue 
  副标题编辑器中枢，负责管理副标题列表的状态同步、分页逻辑及子组件调度。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ListEditorLayout from "@/components/common/list/ListEditorLayout.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import { generateId } from "@/utils/id";
import SubtitleList from "./SubtitleList.vue";

const props = withDefaults(
  defineProps<{
    /** 分页大小 */
    pageSize?: number;
  }>(),
  {
    pageSize: 5,
  },
);

const systemStore = useSystemStore();
const { t } = useLang();

// 使用本地带 ID 的列表，方便在前端处理排序、删除等操作而不直接影响全局状态
const items = ref(
  systemStore.personalInfo.heroSubtitles.map((value) => ({
    id: generateId(),
    value,
  })),
);

// 深度监听本地列表变化，自动同步回全局 Store
watch(
  items,
  (newItems) => {
    systemStore.personalInfo.heroSubtitles = newItems.map((item) => item.value);
  },
  { deep: true },
);

// --- 分页逻辑 ---
const currentPage = ref(1);

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(items.value.length / props.pageSize));
});

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  const end = start + props.pageSize;
  return items.value.slice(start, end);
});

// --- 操作方法 ---
/** 添加一条新的副标题 */
const addSubtitle = () => {
  const newItem = { id: generateId(), value: "" };
  items.value.push(newItem);

  // 如果新增后产生了新页面，自动跳转
  if (totalPages.value > currentPage.value) {
    currentPage.value = totalPages.value;
  }
};

/** 更新特定 ID 的项 */
const updateRow = (id: string, value: string) => {
  const item = items.value.find((item) => item.id === id);
  if (item) {
    item.value = value;
  }
};

/** 移除特定 ID 的项 */
const removeRow = (id: string) => {
  const index = items.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    items.value.splice(index, 1);

    // 如果删除后当前页变空，回退一页
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
    }
  }
};
</script>

<template>
  <ListEditorLayout
    :title="t('views.main.hero.titleEditor.subtitles.title')"
    :count="items.length"
    :add-text="t('views.main.hero.titleEditor.subtitles.add')"
    :show-pagination="items.length > props.pageSize"
    :current-page="currentPage"
    :total-pages="totalPages"
    @add="addSubtitle"
    @update:current-page="currentPage = $event"
  >
    <SubtitleList
      :items="pagedRows"
      :current-page="currentPage"
      :page-size="props.pageSize"
      @update="updateRow"
      @remove="removeRow"
    />
  </ListEditorLayout>
</template>

<style scoped></style>
