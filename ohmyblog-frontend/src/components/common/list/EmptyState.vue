<!-- src/components/common/list/EmptyState.vue -->
<script setup lang="ts">
import InboxIcon from "@/components/icon/common/Inbox.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

withDefaults(
  defineProps<{
    /** 自定义提示文字，默认使用 i18n */
    text?: string;
  }>(),
  {},
);
</script>

<template>
  <div
    class="rounded-2xl border-2 border-dashed border-fg-subtle/10 bg-fg-subtle/2 px-4 py-10 text-center"
  >
    <div class="mb-2 flex justify-center opacity-20">
      <slot name="icon">
        <InboxIcon class="h-8 w-8" />
      </slot>
    </div>
    <p class="text-sm text-fg-muted/60">
      {{ text ?? t("common.list.empty") }}
    </p>
  </div>
</template>
