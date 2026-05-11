<!-- src/views/main/pages/Post.page.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";
import { getPublicPostBySlug } from "@/api/post.api";
import type { PostDetail } from "@/api/post.api";
import { useLang } from "@/composables/lang.hook";
import BaseCard from "@/components/base/card/BaseCard.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import PostHeader from "@/views/main/components/post/PostHeader.vue";
import PostContent from "@/views/main/components/post/PostContent.vue";

const route = useRoute();
const router = useRouter();
const { t } = useLang();

const slug = computed(() => route.params.slug as string);
const post = ref<PostDetail | null>(null);
const loading = ref(false);
const notFound = ref(false);

const formattedDate = computed(() => {
  if (!post.value?.publishedAt) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(post.value.publishedAt))
    .replace(/\//g, "-");
});

const wordCount = computed(() => post.value?.contentText?.length ?? 0);

const fetchPost = async () => {
  loading.value = true;
  notFound.value = false;
  try {
    const result = await getPublicPostBySlug(slug.value);
    post.value = (result as any)?.post ?? null;
    if (!post.value) notFound.value = true;
  } catch {
    notFound.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchPost);
</script>

<template>
  <!-- Loading state -->
  <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
    <p class="text-fg-muted animate-pulse text-sm">{{ t("views.main.post.loading") }}</p>
  </div>

  <!-- Not found state -->
  <div v-else-if="notFound" class="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <p class="text-fg-muted">{{ t("views.main.post.notFound") }}</p>
    <ButtonSecondary :text="t('views.main.post.back')" @click="router.push({ name: 'home' })">
      <ArrowLeft class="w-4 h-4" />
    </ButtonSecondary>
  </div>

  <!-- Post content -->
  <BaseCard v-else-if="post" padding="none" class="flex flex-col overflow-hidden onload-animation">
    <div class="flex flex-col gap-5 p-6 md:p-8">
      <!-- Back button -->
      <ButtonSecondary :text="t('views.main.post.back')" @click="router.back()">
        <ArrowLeft class="w-4 h-4" />
      </ButtonSecondary>

      <PostHeader
        :title="post.title ?? ''"
        :formatted-date="formattedDate"
        :tags="post.tags"
        :word-count="wordCount"
        :view-count="post.viewCount"
      />

      <div class="border-t border-fg-subtle/10" />

      <PostContent :content-markdown="post.contentMarkdown ?? ''" />
    </div>
  </BaseCard>
</template>
