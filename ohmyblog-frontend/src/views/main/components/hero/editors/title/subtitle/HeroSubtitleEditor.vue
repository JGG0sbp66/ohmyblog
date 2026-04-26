<!-- 
  src/views/main/components/hero/editors/title/subtitle/HeroSubtitleEditor.vue 
  副标题编辑器中枢，负责管理副标题列表的状态同步、分页逻辑及子组件调度。
-->
<script setup lang="ts">
import ListEditorLayout from "@/components/common/list/ListEditorLayout.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import { useListEditor } from "@/composables/list-editor.hook";
import SubtitleList from "./SubtitleList.vue";

const props = withDefaults(
  defineProps<{
    /** 分页大小，默认为 5 */
    pageSize?: number;
  }>(),
  {
    pageSize: 5,
  },
);

// --- 基础状态与 Hook ---
const systemStore = useSystemStore();
const { t } = useLang();

/**
 * 列表管理核心逻辑 (Hook)
 * 负责处理本地带 ID 的副标题数组、分页计算、增删跳转以及自动同步回 Store
 */
const {
  items,
  currentPage,
  totalPages,
  pagedRows,
  addItem: addSubtitle,
  removeItem: removeRow,
  updateItem,
} = useListEditor({
  // 数据源：Store 里的副标题原始字符串数组
  initialSource: systemStore.personalInfo.heroSubtitles,
  pageSize: props.pageSize,
  // 转换：将字符串包装成带 ID 的对象，方便 TransitionGroup 渲染
  mapToLocal: (value) => ({ id: "", value }),
  // 还原：同步回 Store 时只保留字符串
  mapToRemote: (item) => item.value,
  onSync: (newValues) => {
    systemStore.personalInfo.heroSubtitles = newValues;
  },
  // 工厂：新增行时的初始结构
  newItemFactory: () => ({ id: "", value: "" }),
});

/**
 * 更新特定 ID 的副标题文本
 */
const updateRow = (id: string, value: string) => {
  updateItem(id, { value });
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
