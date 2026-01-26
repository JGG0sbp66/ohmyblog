<!-- src/components/base/BaseTooltip.vue -->
<script setup lang="ts">
import QuestionIcon from "@/components/icon/Question.vue";

interface Props {
  content: string;
}

defineProps<Props>();
</script>

<template>
  <div class="group relative flex items-center">
    <!-- 触发图标 -->
    <QuestionIcon
      sizeClass="w-3.5 h-3.5"
      class="text-text-icon/40 cursor-help hover:text-primary transition-colors"
    />

    <!-- Tooltip 弹窗内容 -->
    <div
      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-50"
    >
      <!-- 气泡主体 -->
      <div
        class="bg-bg-card border border-text-icon/10 shadow-xl rounded-lg px-3 py-2"
      >
        <p
          class="text-[11px] leading-relaxed text-text-main normal-case font-medium"
        >
          {{ content }}
        </p>
      </div>
      <!-- 小三角 -->
      <div
        class="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-text-icon/10"
      >
        <div
          class="absolute -top-1.75 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-bg-card"
        ></div>
      </div>
    </div>
  </div>
</template>
