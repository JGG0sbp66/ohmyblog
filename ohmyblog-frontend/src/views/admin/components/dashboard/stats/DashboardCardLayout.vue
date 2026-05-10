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
  <BaseCard padding="sm" class="relative overflow-hidden">
    <div
      :class="[
        'absolute top-4 right-4 w-10 h-10 rounded-2xl flex items-center justify-center',
        iconBgClass,
      ]"
    >
      <div :class="['w-5 h-5 flex items-center justify-center', iconClass]">
        <slot name="icon" />
      </div>
    </div>

    <div class="pr-14">
      <div class="text-xs font-semibold text-fg-muted tracking-wide">
        {{ label }}
      </div>

      <div v-if="loading" class="mt-2 h-8 w-36 rounded bg-bg-muted/40" />
      <div v-else class="mt-1 flex items-baseline gap-2 min-w-0">
        <div
          :class="[
            'text-[30px] leading-none font-extrabold truncate',
            valueClass,
          ]"
        >
          {{ displayValue }}
        </div>
        <div v-if="unit" class="text-[14px] leading-none text-fg-muted">
          {{ unit }}
        </div>
      </div>
    </div>
  </BaseCard>
</template>
