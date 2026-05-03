<script setup lang="ts">
/**
 * src/views/admin/components/emails/EmailHeaderInfo.vue
 * 邮件头部元数据展示组件（发件人、收件人、时间）
 * 用于统一邮件详情页和 SMTP 预览页的样式
 */

interface Props {
  senderName: string;
  senderEmail: string;
  to: string;
  time: string;
}

defineProps<Props>();
</script>

<template>
  <div class="flex-1 min-w-0">
    <!-- 发件人信息 -->
    <div class="text-sm font-bold flex items-center gap-2 truncate text-fg">
      {{ senderName }}
      <span class="text-xs font-normal opacity-50">
        &lt;{{ senderEmail }}&gt;
      </span>
    </div>

    <!-- 收件人和时间 -->
    <div class="flex items-center justify-between mt-1">
      <div class="text-xs opacity-40 truncate mr-4">To: {{ to }}</div>
      <div class="text-xs opacity-30 whitespace-nowrap">
        {{ time }}
      </div>
    </div>
  </div>
</template>
