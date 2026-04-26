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
    /** 分页大小 */
    pageSize?: number;
  }>(),
  {
    pageSize: 5,
  },
);

const systemStore = useSystemStore();
const { t } = useLang();

// 使用通用的列表编辑器 Hook
const {
  items,
  currentPage,
  totalPages,
  pagedRows,
  addItem: addSubtitle,
  removeItem: removeRow,
  updateItem,
} = useListEditor({
  initialSource: systemStore.personalInfo.heroSubtitles,
  pageSize: props.pageSize,
  mapToLocal: (value) => ({ id: "", value }), // id 会在 Hook 内部自动处理
  mapToRemote: (item) => item.value,
  onSync: (newValues) => {
    systemStore.personalInfo.heroSubtitles = newValues;
  },
  newItemFactory: () => ({ id: "", value: "" }),
});

/** 更新特定 ID 的项 */
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
