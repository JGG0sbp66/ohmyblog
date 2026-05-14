<!-- src/views/main/components/archive/ArchivePostItem.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

const props = defineProps<{
  title: string;
  slug: string | null;
  publishedAt: Date | string | null;
  tags: string[];
}>();

const formattedDate = computed(() => {
  if (!props.publishedAt) return "--/--";
  const d = new Date(props.publishedAt);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}-${day}`;
});

const formattedTags = computed(() =>
  props.tags.map((tag) => `#${tag}`).join(" "),
);
</script>

<template>
  <RouterLink
    :to="slug ? { name: 'post', params: { slug } } : '#'"
    :aria-label="title"
    class="group flex items-center h-10 w-full rounded-lg hover:bg-accent/5"
  >
    <div class="flex flex-row justify-start items-center h-full w-full">
      <!-- 日期：MM-DD -->
      <div
        class="w-[15%] md:w-[10%] text-sm text-right text-fg-muted pr-1 shrink-0"
      >
        {{ formattedDate }}
      </div>

      <!-- 竖线 + 圆点 -->
      <div
        class="dash-line w-[15%] md:w-[10%] relative h-full flex items-center"
      >
        <div
          class="timeline-dot mx-auto w-1 h-1 rounded z-10 bg-fg-muted group-hover:h-5 group-hover:bg-accent"
        />
      </div>

      <!-- 文章标题 -->
      <div
        class="w-[70%] md:max-w-[65%] md:w-[65%] text-left font-bold text-fg/75 group-hover:translate-x-1 transition-all group-hover:text-accent pr-8 whitespace-nowrap overflow-hidden text-ellipsis"
      >
        {{ title || t("views.main.archive.untitled") }}
      </div>

      <!-- 标签列表（仅桌面端） -->
      <div
        v-if="tags?.length"
        class="hidden md:block md:w-[15%] text-left text-sm whitespace-nowrap overflow-hidden text-ellipsis text-fg-muted/60"
      >
        {{ formattedTags }}
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.dash-line::before {
  content: "";
  position: absolute;
  width: 10%;
  height: 100%;
  left: calc(50% - 1px);
  border-left: 2px dashed var(--theme-border);
  pointer-events: none;
  transition: all 0.3s;
  transform: translateY(-50%);
}

.timeline-dot {
  transition-property: height, background-color;
  transition-duration: 200ms;
}
</style>
