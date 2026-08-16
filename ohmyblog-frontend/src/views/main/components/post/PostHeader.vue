<!-- src/views/main/components/post/PostHeader.vue -->
<script setup lang="ts">
import { Eye, FileText } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import PostMeta from "@/components/base/tag/PostMeta.vue";

defineProps<{
  title: string;
  subtitle?: string | null;
  formattedDate: string;
  tags: string[] | null;
  wordCount: number;
  viewCount: number | null;
}>();

const { t } = useLang();
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 标题 + 副标题紧挨成组，间距小于外层节奏；副标题对齐标题的左缩进，
         但不带 accent 竖条 —— 竖条只属于主标题 -->
    <div class="flex flex-col gap-2">
      <h1
        class="text-3xl md:text-4xl font-bold leading-snug text-fg border-l-4 border-accent pl-4 -ml-0.5"
      >
        {{ title || t("views.main.post.untitled") }}
      </h1>
      <p
        v-if="subtitle"
        class="pl-4 -ml-0.5 text-lg leading-relaxed text-fg-muted"
      >
        {{ subtitle }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
      <PostMeta :date="formattedDate" :tags="tags ?? []" :max-tags="10" />
      <div class="flex items-center gap-3 text-xs text-fg-subtle/60">
        <span class="flex items-center gap-1">
          <FileText class="w-3 h-3" />
          {{ wordCount }} {{ t("views.main.post.words") }}
        </span>
        <span class="text-fg-subtle/30">|</span>
        <span class="flex items-center gap-1">
          <Eye class="w-3 h-3" />
          {{ viewCount ?? 0 }} {{ t("views.main.post.views") }}
        </span>
      </div>
    </div>
  </div>
</template>
