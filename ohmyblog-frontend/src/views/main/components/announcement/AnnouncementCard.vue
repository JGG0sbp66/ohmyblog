<!-- src/views/main/components/announcement/AnnouncementCard.vue -->
<script setup lang="ts">
import { RiMegaphoneLine } from "@remixicon/vue";
import BaseCard from "@/components/base/card/BaseCard.vue";
import { useAnnouncement } from "./use-announcement";

/**
 * AnnouncementCard — 桌面侧边栏公告卡片
 *
 * 不参与「关闭」：侧边栏空间是常驻的，关掉反而留一块空白；
 * 关闭只在移动端横幅上提供（见 AnnouncementBanner.vue）。
 */
const { available, title, content } = useAnnouncement();
</script>

<template>
  <BaseCard
    v-if="available"
    padding="none"
    class="w-70 p-5 rounded-2xl! flex flex-col gap-3"
  >
    <!-- 标题区域 -->
    <div class="flex items-center gap-2">
      <RiMegaphoneLine class="w-5 h-5 shrink-0 text-accent" />
      <h2 class="text-base font-black text-fg tracking-tight truncate">
        {{ title }}
      </h2>
    </div>

    <div class="w-8 h-1 bg-accent/80 rounded-full"></div>

    <!-- 正文：纯文本，保留换行；限制行数避免 sticky 侧边栏在矮视口下被裁 -->
    <p
      class="text-sm text-fg-muted font-medium leading-relaxed whitespace-pre-line line-clamp-8 break-words"
    >
      {{ content }}
    </p>
  </BaseCard>
</template>

<style scoped></style>
