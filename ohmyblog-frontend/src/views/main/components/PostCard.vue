<!-- src/views/main/components/PostCard.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { Eye, FileText, ChevronRight } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import PostMeta from "@/components/base/tag/PostMeta.vue";
import type { PostListItem } from "@/api/post.api";

const props = defineProps<{
  post: PostListItem;
}>();

const { t } = useLang();

const formattedDate = computed(() => {
  if (!props.post.publishedAt) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(props.post.publishedAt))
    .replace(/\//g, "-");
});

const excerpt = computed(
  () => props.post.excerpt || props.post.contentText?.slice(0, 120) || "",
);

const wordCount = computed(() => props.post.contentText?.length ?? 0);
</script>

<template>
  <div
    class="group relative flex items-stretch bg-bg-card rounded-2xl shadow-lg overflow-hidden hover:-translate-y-0.5 transition-transform duration-200 cursor-pointer select-none"
  >
    <!-- 左侧：信息区域 -->
    <div class="flex-1 min-w-0 p-5 flex flex-col gap-2.5">
      <!-- 标题 -->
      <h2
        class="text-[26px] font-bold leading-snug text-fg line-clamp-2 border-l-4 border-accent pl-3 -ml-0.5"
      >
        {{ post.title || t("views.main.home.PostCard.untitled") }}
      </h2>

      <!-- Meta 行：日期 + 标签（提取为组件） -->
      <PostMeta :date="formattedDate" :tags="post.tags" :max-tags="3" />

      <!-- 摘要 -->
      <p
        v-if="excerpt"
        class="text-sm text-fg-muted leading-relaxed line-clamp-2 flex-1"
      >
        {{ excerpt }}
      </p>
      <div v-else class="flex-1" />

      <!-- 底部：字数 + 阅读量 -->
      <div class="flex items-center gap-3 text-xs text-fg-subtle/60 mt-auto">
        <span class="flex items-center gap-1">
          <FileText class="w-3 h-3" />
          {{ wordCount }} {{ t("views.main.home.PostCard.words") }}
        </span>
        <span class="text-fg-subtle/30">|</span>
        <span class="flex items-center gap-1">
          <Eye class="w-3 h-3" />
          {{ post.viewCount }} {{ t("views.main.home.PostCard.views") }}
        </span>
      </div>
    </div>

    <!-- 右侧：封面图区域（有无封面宽度不同） -->
    <div
      :class="[
        'shrink-0 m-3 rounded-xl overflow-hidden relative transition-[width] duration-200',
        post.coverImage ? 'w-40 md:w-56' : 'w-13',
      ]"
    >
      <!-- 有封面图 -->
      <template v-if="post.coverImage">
        <img
          :src="post.coverImage"
          :alt="post.title"
          class="w-full h-full object-cover"
        />
        <!-- 悬浮遮罩 + 右箭头（仿 ProfileCard 效果） -->
        <div
          class="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <div
            class="transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-spring"
          >
            <ChevronRight class="w-8 h-8 text-white" />
          </div>
        </div>
      </template>

      <!-- 无封面图：主题色细长条 + 常驻右箭头 -->
      <template v-else>
        <div
          class="w-full h-full bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 transition-colors duration-200"
        >
          <ChevronRight
            class="w-5 h-5 text-accent transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ease-spring {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
