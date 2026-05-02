<!-- 
  src/views/admin/components/emails/EmailListCard.vue 
  邮件列表项卡片
  - 展示邮件类型、发送时间、主题摘要
  - 支持激活状态样式切换
  - 针对发送失败的邮件显示错误标识
-->
<script setup lang="ts">
import type { EmailLogItem } from "./types";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import { useLang } from "@/composables/lang.hook";

const props = defineProps<{
  item: EmailLogItem;
  active?: boolean;
}>();

const { t } = useLang();

/**
 * 格式化发送时间
 * @param raw 原始时间数据
 */
const formatTime = (raw: string | number | Date) => {
  const d = new Date(raw);
  return d.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<template>
  <div
    class="group p-4 cursor-pointer transition-all duration-200 border-b border-fg-muted/10 last:border-b-0 relative"
    :class="[
      active 
        ? 'bg-accent/10' 
        : 'bg-transparent hover:bg-accent/5 active:bg-accent/10'
    ]"
  >
    <!-- 选中状态的左侧标识条 -->
    <div 
      v-if="active"
      class="absolute left-0 top-0 bottom-0 w-1 bg-accent"
    ></div>
    <div class="flex justify-between items-start mb-1">
      <span class="text-[10px] font-bold uppercase tracking-wider text-fg-subtle truncate max-w-37.5">
        {{ t(`views.emails.types.${item.type}`) }}
      </span>
      <span class="text-[10px] font-medium text-fg-subtle shrink-0">
        {{ formatTime(item.createdAt) }}
      </span>
    </div>
    
    <h3 
      class="text-sm font-bold mb-1 line-clamp-1 transition-colors"
      :class="[active ? 'text-accent' : 'text-fg group-hover:text-accent']"
    >
      {{ item.subject }}
    </h3>
    
    <p class="text-xs text-fg-muted line-clamp-2 break-all leading-relaxed">
      {{ item.to }}
    </p>

    <div v-if="!active && item.status === 'failed'" class="mt-2">
      <BaseTag type="error" size="sm" class="px-1.5 py-0.5 text-[9px] uppercase font-bold">
        {{ t('views.emails.statuses.failed') }}
      </BaseTag>
    </div>
  </div>
</template>
