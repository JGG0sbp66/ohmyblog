<!-- 
  src/views/main/components/hero/editors/title/subtitle/SubtitleList.vue 
  副标题列表展示组件，包含输入框、删除按钮及列表动画。
-->
<script setup lang="ts">
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import Trash from "@/components/icon/common/Trash.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

defineProps<{
  /** 带唯一 ID 的副标题项列表 */
  items: Array<{ id: string; value: string }>;
  /** 当前页码，用于计算 placeholder 索引 */
  currentPage: number;
  /** 每页条数 */
  pageSize: number;
}>();

defineEmits<{
  /** 更新某一项的值 */
  (e: "update", id: string, value: string): void;
  /** 移除某一项 */
  (e: "remove", id: string): void;
}>();
</script>

<template>
  <div class="space-y-4">
    <TransitionGroup name="list" tag="div" class="relative flex flex-col gap-3">
      <div v-for="(row, index) in items" :key="row.id" class="relative">
        <div
          class="flex items-stretch gap-3 rounded-xl bg-bg-card/40 transition-all duration-300 hover:bg-bg-card/80 hover:shadow-lg hover:shadow-black/5"
        >
          <TipInput
            :model-value="row.value"
            :placeholder="
              t('views.main.hero.titleEditor.subtitles.placeholder', {
                index: (currentPage - 1) * pageSize + index + 1,
              })
            "
            class="flex-1 h-11 bg-transparent! p-0! pl-3"
            @update:modelValue="(val) => $emit('update', row.id, String(val))"
          />

          <div class="w-11 h-11">
            <ButtonSecondary
              class="w-full h-full text-fg-subtle/30 hover:text-red-500 hover:before:bg-red-500/10"
              :title="t('views.main.hero.titleEditor.subtitles.remove')"
              @click="$emit('remove', row.id)"
            >
              <Trash class="h-4 w-4" />
            </ButtonSecondary>
          </div>
        </div>
      </div>
    </TransitionGroup>
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
</style>
