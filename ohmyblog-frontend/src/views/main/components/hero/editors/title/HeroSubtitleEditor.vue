<!-- 
  src/views/main/components/hero/editors/title/HeroSubtitleEditor.vue 
  副标题编辑器中枢，负责管理副标题列表的状态同步、分页逻辑及子组件调度。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import BasePagination from "@/components/base/table/BasePagination.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import Add from "@/components/icon/common/Add.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import HeroTitleEditorLayout from "./HeroTitleEditorLayout.vue";
import SubtitleEmptyState from "./subtitle/SubtitleEmptyState.vue";
import SubtitleList from "./subtitle/SubtitleList.vue";

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

// 生成唯一 ID 确保动画 key 稳定，避免在渲染列表时使用 index 作为 key 导致的动画异常
const generateId = () =>
  Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

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
  <HeroTitleEditorLayout
    :title="t('views.main.hero.titleEditor.subtitles.title')"
  >
    <template #title-extra>
      <BaseTag type="info" size="sm">
        {{
          t("views.main.hero.titleEditor.subtitles.count", {
            count: items.length,
          })
        }}
      </BaseTag>
    </template>

    <template #header-actions>
      <ButtonSecondary
        :text="t('views.main.hero.titleEditor.subtitles.add')"
        class="group"
        @click="addSubtitle"
      >
        <Add class="transition-transform duration-300 group-hover:rotate-90" />
      </ButtonSecondary>
    </template>

    <Transition name="fade" mode="out-in">
      <SubtitleEmptyState v-if="items.length === 0" key="empty" />
      <SubtitleList
        v-else
        key="list"
        :items="pagedRows"
        :current-page="currentPage"
        :page-size="props.pageSize"
        @update="updateRow"
        @remove="removeRow"
      />
    </Transition>

    <template #footer>
      <div v-if="items.length > props.pageSize" class="pt-2">
        <BasePagination
          :current-page="currentPage"
          :total-pages="totalPages"
          @update:currentPage="currentPage = $event"
        />
      </div>
    </template>
  </HeroTitleEditorLayout>
</template>

<style scoped>
/* 状态切换动画 (Empty <-> List) */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease-out;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
