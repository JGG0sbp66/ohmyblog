<!-- src/views/main/components/announcement/AnnouncementCard.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { RiMegaphoneLine } from "@remixicon/vue";
import BaseCard from "@/components/base/card/BaseCard.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";

const { t } = useLang();
const systemStore = useSystemStore();

// 开关关闭或正文为空时整张卡不渲染，避免侧边栏留下一个空壳
const visible = computed(
  () =>
    systemStore.announcement.enabled &&
    !!systemStore.announcement.content?.trim(),
);

// 标题留空时回落到默认文案
const title = computed(
  () =>
    systemStore.announcement.title?.trim() ||
    t("views.main.announcement.defaultTitle"),
);
</script>

<template>
  <BaseCard
    v-if="visible"
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
      {{ systemStore.announcement.content }}
    </p>
  </BaseCard>
</template>

<style scoped></style>
