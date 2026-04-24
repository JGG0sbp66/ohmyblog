<!-- src/views/main/components/hero/editors/title/HeroSubtitleEditor.vue -->
<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import BasePagination from "@/components/base/table/BasePagination.vue";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import Add from "@/components/icon/common/Add.vue";
import Trash from "@/components/icon/common/Trash.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";

const props = withDefaults(
  defineProps<{
    pageSize?: number;
  }>(),
  {
    pageSize: 5,
  },
);

const systemStore = useSystemStore();
const { t } = useLang();
const [subtitleSectionRef] = useAutoAnimate();
const [subtitleListRef, enableSubtitleListAnimation] = useAutoAnimate();
// 副标题列表直接来源于全局 store。
const subtitles = computed(() => systemStore.personalInfo.heroSubtitles);

const currentPage = ref(1);

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(subtitles.value.length / props.pageSize));
});

const pagedRows = computed(() => {
  // 仅切出当前页所需数据，渲染时保留原始绝对索引用于更新/删除。
  const start = (currentPage.value - 1) * props.pageSize;
  const end = start + props.pageSize;

  return subtitles.value.slice(start, end).map((value, index) => ({
    value,
    absoluteIndex: start + index,
  }));
});

const addSubtitle = async () => {
  // TODO: 修复添加每页第二条数据时出现从上方飞入的动画问题
  // 问题：当添加每一页的第二条数据时，新条目会从上方飞下来到正常位置
  // 可能原因：auto-animate 在列表项数量变化时的动画计算问题
  // 解决方向：
  // 1. 考虑在添加时临时禁用 subtitleListRef 的动画
  // 2. 或者调整 auto-animate 的配置选项
  // 3. 或者检查 key 的生成逻辑是否导致动画异常

  // 1. 执行新增
  systemStore.personalInfo.heroSubtitles = [...subtitles.value, ""];
  // 2. 计算新增后的总页数
  const newTotalPages = Math.ceil(subtitles.value.length / props.pageSize);
  // 3. 如果新页数大于当前页，自动跳转到最后一页
  if (newTotalPages > currentPage.value) {
    await updatePage(newTotalPages);
  }
};

const updateRow = (absoluteIndex: number, value: string) => {
  // 用新数组回写，保证响应式更新稳定触发。
  const next = [...subtitles.value];
  next[absoluteIndex] = value;
  systemStore.personalInfo.heroSubtitles = next;
};

const removeRow = async (absoluteIndex: number) => {
  // 1. 执行删除
  const next = [...subtitles.value];
  next.splice(absoluteIndex, 1);
  systemStore.personalInfo.heroSubtitles = next;
  // 2. 计算删除后的新总页数 (至少为1页)
  const newTotalPages = Math.max(1, Math.ceil(next.length / props.pageSize));
  // 3. 如果当前页码大于新的总页数，说明当前页码已经失效，跳转到新的最后一页
  if (currentPage.value > newTotalPages) {
    await updatePage(newTotalPages);
  }
};

const updatePage = async (page: number) => {
  // 翻页时临时关闭行级动画，避免整页替换导致弹窗高度抖动。
  enableSubtitleListAnimation(false);
  currentPage.value = page;
  await nextTick();
  enableSubtitleListAnimation(true);
};
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-bold tracking-wide text-fg-subtle uppercase">
          {{ t("views.main.hero.titleEditor.subtitles.title") }}
        </h3>
        <BaseTag type="info" size="sm">
          {{
            t("views.main.hero.titleEditor.subtitles.count", {
              count: subtitles.length,
            })
          }}
        </BaseTag>
      </div>
      <ButtonSecondary
        :text="t('views.main.hero.titleEditor.subtitles.add')"
        @click="addSubtitle"
      >
        <Add />
      </ButtonSecondary>
    </div>

    <div ref="subtitleSectionRef" class="space-y-3">
      <div
        v-if="subtitles.length === 0"
        class="rounded-xl border border-dashed border-fg-subtle/25 px-4 py-6 text-center text-sm text-fg-muted"
      >
        {{ t("views.main.hero.titleEditor.subtitles.empty") }}
      </div>

      <div
        v-else
        :key="`subtitle-page-${currentPage}`"
        ref="subtitleListRef"
        class="space-y-4 fade-in-fast"
      >
        <div
          v-for="row in pagedRows"
          :key="`subtitle-row-${row.absoluteIndex}`"
          class="rounded-xl bg-bg-card/50"
        >
          <div class="flex items-start gap-3">
            <TipInput
              :model-value="row.value"
              :placeholder="
                t('views.main.hero.titleEditor.subtitles.placeholder', {
                  index: row.absoluteIndex + 1,
                })
              "
              @update:modelValue="
                (value) => updateRow(row.absoluteIndex, String(value))
              "
            />

            <div class="h-11 w-11 shrink-0">
              <ButtonSecondary
                class="h-full w-full text-red-500/70 before:bg-red-500/10 hover:text-red-500"
                :title="t('views.main.hero.titleEditor.subtitles.remove')"
                @click="removeRow(row.absoluteIndex)"
              >
                <Trash />
              </ButtonSecondary>
            </div>
          </div>
        </div>
      </div>

      <BasePagination
        v-if="subtitles.length > props.pageSize"
        :current-page="currentPage"
        :total-pages="totalPages"
        @update:currentPage="updatePage"
      />
    </div>
  </div>
</template>
