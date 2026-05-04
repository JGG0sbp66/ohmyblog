<!-- src/components/common/button/DeleteButton.vue -->
<script setup lang="ts">
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import Trash from "@/components/icon/common/Trash.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

defineProps<{
  /** 按钮的提示文字，默认为 common.delete */
  title?: string;
}>();

defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <div class="w-11 h-11 shrink-0">
    <ButtonSecondary
      class="w-full h-full text-fg-subtle hover:text-red-500 hover:before:bg-red-500/10"
      :title="title || t('common.delete')"
      @click="$emit('click')"
    >
      <Trash class="h-4 w-4" />
    </ButtonSecondary>
  </div>
</template>
