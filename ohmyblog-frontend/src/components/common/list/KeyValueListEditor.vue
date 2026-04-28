<!-- 
  src/components/common/list/KeyValueListEditor.vue 
  通用键值对列表展示组件，包含输入框、删除按钮及列表动画。
-->
<script setup lang="ts">
import TipInput from "@/components/common/input/TipInput.vue";
import ListRowLayout from "@/components/common/list/ListRowLayout.vue";

interface KeyValueItem {
  id: string;
  name: string;
  url: string;
}

defineProps<{
  /** 键值对列表 */
  items: KeyValueItem[];
  /** Key 的占位符 */
  keyPlaceholder?: string;
  /** Value 的占位符 */
  valuePlaceholder?: string;
  /** 当前页码，用于翻页时重建 TransitionGroup，避免第一个问题 */
  pageKey?: number;
}>();

defineEmits<{
  /** 更新某一项 */
  (e: "update", id: string, key: string, value: string): void;
  /** 移除某一项 */
  (e: "remove", id: string): void;
}>();
</script>

<template>
  <TransitionGroup
    name="list-item-anim"
    tag="div"
    class="relative flex flex-col gap-3"
    :key="pageKey"
    appear
  >
    <ListRowLayout
      v-for="row in items"
      :key="row.id"
      @remove="$emit('remove', row.id)"
    >
      <div class="flex items-start gap-3">
        <!-- Key (Name) - 较短 -->
        <div class="w-1/3 min-w-20">
          <TipInput
            :model-value="row.name"
            :placeholder="keyPlaceholder || '名称'"
            @update:modelValue="
              (val) => $emit('update', row.id, String(val), row.url)
            "
          />
        </div>

        <!-- Value (URL) - 较长 -->
        <div class="flex-1 min-w-0">
          <TipInput
            :model-value="row.url"
            :placeholder="valuePlaceholder || '链接'"
            @update:modelValue="
              (val) => $emit('update', row.id, row.name, String(val))
            "
          />
        </div>
      </div>
    </ListRowLayout>
  </TransitionGroup>
</template>

<style scoped></style>
