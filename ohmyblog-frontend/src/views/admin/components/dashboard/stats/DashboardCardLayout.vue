<script setup lang="ts">
/**
 * 仪表盘统计卡片通用布局
 * 左侧上下排列 label / value（支持单位），右上角 icon，支持主题色定制
 */
import { computed } from "vue";
import BaseCard from "@/components/base/card/BaseCard.vue";

interface Props {
  label: string;
  value?: number | string | null;
  unit?: string;
  loading?: boolean;
  iconClass?: string;
  iconBgClass?: string;
  valueClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  unit: "",
  loading: false,
  iconClass: "text-fg-muted",
  iconBgClass: "bg-bg-muted/40",
  valueClass: "text-fg",
});

const displayValue = computed(() => {
  if (props.loading) return "";
  if (props.value === null || props.value === undefined) return "--";
  if (typeof props.value === "number") return props.value.toLocaleString();
  return props.value;
});
</script>

<template>
  <BaseCard padding="sm" class="relative overflow-hidden p-4! sm:p-6!">
    <div
      :class="[
        'absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl sm:top-4 sm:right-4 sm:h-10 sm:w-10 sm:rounded-2xl',
        iconBgClass,
      ]"
    >
      <div :class="['w-5 h-5 flex items-center justify-center', iconClass]">
        <slot name="icon" />
      </div>
    </div>

    <div class="pr-10 sm:pr-14">
      <div class="text-xs font-semibold text-fg-muted tracking-wide">
        {{ label }}
      </div>

      <div
        v-if="loading"
        class="mt-2 h-7 w-full max-w-36 rounded bg-bg-muted/40 sm:h-8"
      />
      <div v-else class="mt-1 flex items-baseline gap-2 min-w-0">
        <div
          :class="[
            'truncate text-2xl leading-none font-extrabold sm:text-[30px]',
            valueClass,
          ]"
        >
          {{ displayValue }}
        </div>
        <div
          v-if="unit"
          class="shrink-0 whitespace-nowrap text-xs leading-none text-fg-muted sm:text-[14px]"
        >
          {{ unit }}
        </div>
      </div>
    </div>
  </BaseCard>
</template>
