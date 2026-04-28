<!-- 
  src/views/admin/components/settings/sections/smtp/RecipientPreviewList.vue
  收件人列表：将解析后的邮箱地址渲染为可编辑行，支持逐条修改与删除。
-->
<script setup lang="ts">
import TipInput from "@/components/common/input/TipInput.vue";
import ListRowLayout from "@/components/common/list/ListRowLayout.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

defineProps<{
  /** 收件人列表，id 用于渲染 key */
  items: Array<{ id: string; value: string }>;
}>();

defineEmits<{
  /** 更新某一行的值 */
  (e: "update", id: string, value: string): void;
  /** 删除某一行 */
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
      v-for="item in items"
      :key="item.id"
      @remove="$emit('remove', item.id)"
    >
      <TipInput
        :model-value="item.value"
        :placeholder="t('views.admin.Settings.smtp.send.list.placeholder')"
        @update:modelValue="(val) => $emit('update', item.id, String(val))"
      />
    </ListRowLayout>
  </TransitionGroup>
</template>

<style scoped></style>
