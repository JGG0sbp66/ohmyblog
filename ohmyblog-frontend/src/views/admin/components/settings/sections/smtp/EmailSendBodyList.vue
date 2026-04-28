<!-- 
  src/views/admin/components/settings/sections/smtp/EmailSendBodyList.vue
  邮件正文段落列表，展示可编辑的段落行，复用 ListRowLayout + TipInput 结构。
-->
<script setup lang="ts">
import TipInput from "@/components/common/input/TipInput.vue";
import ListRowLayout from "@/components/common/list/ListRowLayout.vue";

defineProps<{
  /** 带唯一 ID 的段落列表 */
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
    <ListRowLayout
      v-for="(row, index) in items"
      :key="row.id"
      @remove="$emit('remove', row.id)"
    >
      <TipInput
        :model-value="row.value"
        :placeholder="`段落 ${(currentPage - 1) * pageSize + index + 1}`"
        @update:modelValue="(val) => $emit('update', row.id, String(val))"
      />
    </ListRowLayout>
  </TransitionGroup>
</template>

<style scoped></style>
