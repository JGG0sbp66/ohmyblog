<!-- 
  src/components/common/list/KeyValueListEditor.vue 
  通用键值对列表展示组件，包含输入框、删除按钮及列表动画。
-->
<script setup lang="ts">
import TipInput from "@/components/common/input/TipInput.vue";
import DeleteButton from "@/components/common/button/DeleteButton.vue";

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
  >
    <div v-for="row in items" :key="row.id" class="relative">
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

        <!-- 删除按钮 -->
        <DeleteButton class="pt-1" @click="$emit('remove', row.id)" />
      </div>
    </div>
  </TransitionGroup>
</template>

<style scoped></style>
