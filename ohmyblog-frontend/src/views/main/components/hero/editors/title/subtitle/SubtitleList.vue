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
  <TransitionGroup
    name="list-item-anim"
    tag="div"
    class="relative flex flex-col gap-3"
  >
    <div v-for="(row, index) in items" :key="row.id" class="relative">
      <div class="flex items-start gap-3">
        <TipInput
          :model-value="row.value"
          :placeholder="
            t('views.main.hero.titleEditor.subtitles.placeholder', {
              index: (currentPage - 1) * pageSize + index + 1,
            })
          "
          class="flex-1"
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
</template>

<style scoped></style>
