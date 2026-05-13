<!-- src/components/common/list/EmptyState.vue -->
<script setup lang="ts">
import { Inbox } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";

const { t } = useLang();
const systemStore = useSystemStore();

withDefaults(
  defineProps<{
    /** 自定义提示文字，默认使用 i18n */
    text?: string;
    /** 是否作为页面首要占位（会根据 Hero 图状态自动调整边距） */
    isPagePlaceholder?: boolean;
  }>(),
  {
    isPagePlaceholder: false,
  },
);
</script>

<template>
  <div
    :class="[
      'rounded-2xl border-2 border-dashed border-fg-subtle/10 bg-fg-subtle/2 px-4 text-center',
      isPagePlaceholder ? (systemStore.personalInfo.hero ? 'py-32' : 'py-16') : 'py-10',
    ]"
  >
    <div class="mb-2 flex justify-center opacity-20">
      <slot name="icon">
        <Inbox class="h-8 w-8" />
      </slot>
    </div>
    <p class="text-sm text-fg-muted/60">
      {{ text ?? t("common.list.empty") }}
    </p>
  </div>
</template>
