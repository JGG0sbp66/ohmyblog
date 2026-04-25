<!-- src/views/main/components/hero/editors/title/HeroSubtitleEditor.vue -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
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

// 生成唯一 ID 确保动画 key 稳定
const generateId = () =>
  Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// 使用本地带 ID 的列表
const items = ref(
  systemStore.personalInfo.heroSubtitles.map((value) => ({
    id: generateId(),
    value,
  })),
);

// 同步回 store
watch(
  items,
  (newItems) => {
    systemStore.personalInfo.heroSubtitles = newItems.map((item) => item.value);
  },
  { deep: true },
);

const currentPage = ref(1);

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(items.value.length / props.pageSize));
});

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  const end = start + props.pageSize;
  return items.value.slice(start, end);
});

const addSubtitle = () => {
  const newItem = { id: generateId(), value: "" };
  items.value.push(newItem);

  if (totalPages.value > currentPage.value) {
    currentPage.value = totalPages.value;
  }
};

const updateRow = (id: string, value: string) => {
  const item = items.value.find((item) => item.id === id);
  if (item) {
    item.value = value;
  }
};

const removeRow = (id: string) => {
  const index = items.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    items.value.splice(index, 1);

    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
    }
  }
};
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-bold tracking-widest text-fg-subtle uppercase">
          {{ t("views.main.hero.titleEditor.subtitles.title") }}
        </h3>
        <BaseTag type="info" size="sm" class="font-mono">
          {{
            t("views.main.hero.titleEditor.subtitles.count", {
              count: items.length,
            })
          }}
        </BaseTag>
      </div>
      <ButtonSecondary
        :text="t('views.main.hero.titleEditor.subtitles.add')"
        class="group"
        @click="addSubtitle"
      >
        <Add class="transition-transform duration-300 group-hover:rotate-90" />
      </ButtonSecondary>
    </div>

    <div class="relative min-h-[100px]">
      <!-- 空状态切换 -->
      <Transition name="fade" mode="out-in">
        <div
          v-if="items.length === 0"
          class="rounded-2xl border-2 border-dashed border-fg-subtle/10 bg-fg-subtle/2 px-4 py-10 text-center"
        >
          <div class="mb-2 flex justify-center opacity-20">
            <Trash class="h-8 w-8" />
          </div>
          <p class="text-sm text-fg-muted/60">
            {{ t("views.main.hero.titleEditor.subtitles.empty") }}
          </p>
        </div>

        <!-- 列表容器 -->
        <div v-else :key="`page-${currentPage}`" class="space-y-4">
          <TransitionGroup
            name="list"
            tag="div"
            class="relative flex flex-col gap-3"
          >
            <div
              v-for="(row, index) in pagedRows"
              :key="row.id"
              class="relative"
            >
              <div
                class="flex items-center gap-3 rounded-xl bg-bg-card/40 p-1.5 transition-all duration-300 hover:bg-bg-card/80 hover:shadow-lg hover:shadow-black/5"
              >
                <TipInput
                  :model-value="row.value"
                  :placeholder="
                    t('views.main.hero.titleEditor.subtitles.placeholder', {
                      index: (currentPage - 1) * props.pageSize + index + 1,
                    })
                  "
                  class="bg-transparent! p-0! pl-3"
                  @update:modelValue="(val) => updateRow(row.id, String(val))"
                />

                <button
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-fg-subtle/30 transition-all hover:bg-red-500/10 hover:text-red-500"
                  :title="t('views.main.hero.titleEditor.subtitles.remove')"
                  @click="removeRow(row.id)"
                >
                  <Trash class="h-4 w-4" />
                </button>
              </div>
            </div>
            </TransitionGroup>
          </div>
        </Transition>
      </div>

    <div v-if="items.length > props.pageSize" class="pt-2">
      <BasePagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @update:currentPage="currentPage = $event"
      />
    </div>
  </div>
</template>

<style scoped>
/* 列表项动画 (Add/Remove) */
.list-enter-active,
.list-leave-active {
  transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.list-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
  filter: blur(4px);
}

.list-leave-to {
  opacity: 0;
  transform: scale(0.9) translateX(20px);
  filter: blur(4px);
}

/* 列表移动动画 */
.list-move {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 离开时的绝对定位，确保平滑移动 */
.list-leave-active {
  position: absolute;
  width: 100%;
  z-index: 0;
}

/* 页面切换/状态切换动画 */
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



