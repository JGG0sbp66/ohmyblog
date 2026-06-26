<!-- src/views/main/pages/Post.page.vue -->
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";
import { getPublicPostBySlug } from "@/api/post.api";
import type { PublicPostDetail } from "@/api/post.api";
import { useLang } from "@/composables/lang.hook";
import BaseCard from "@/components/base/card/BaseCard.vue";
import Loading from "@/components/common/item/Loading.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import PostHeader from "@/views/main/components/post/PostHeader.vue";
import PostContent from "@/views/main/components/post/PostContent.vue";

const route = useRoute();
const router = useRouter();
const { t } = useLang();

const slug = computed(() => route.params.slug as string);
const post = ref<PublicPostDetail | null>(null);
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

const wordCount = computed(() => post.value?.wordCount ?? 0);

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

watch(slug, fetchPost, { immediate: true });
</script>

<template>
  <!-- Loading state -->
  <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
    <Loading size-class="w-6 h-6" color-class="text-fg-subtle" />
  </div>

  <!-- Not found state -->
  <div
    v-else-if="notFound"
    class="flex flex-col items-center justify-center min-h-[50vh] gap-4"
  >
    <p class="text-fg-muted">{{ t("views.main.post.notFound") }}</p>
    <ButtonSecondary
      :text="t('views.main.post.back')"
      @click="router.push({ name: 'home' })"
    >
      <ArrowLeft class="w-4 h-4" />
    </ButtonSecondary>
  </div>

  <!-- Post content -->
  <!--
    TODO(mobile-flush-layout): 手机端文章渲染左右贴合
    - 现状：移动端 BaseCard 内层有 p-6 内边距 + MainLayout 的 px-4，文章正文左右留白偏大，
      空间利用率低。
    - 目标：参考首页文章列表（Home.page / PostCard）的移动端处理，窄屏下让正文区左右尽量
      贴合屏幕边缘，最大化可用宽度（表格/代码块等宽内容尤其受益）。
    - 注意：仅改窄屏（< md），桌面端维持现有 md:p-8 留白；标题/日期/正文要统一对齐，
      不要只动正文导致错位；改完回归检查表格横向滚动仍正常。
  -->
  <BaseCard
    v-else-if="post"
    padding="none"
    class="flex flex-col overflow-hidden onload-animation"
  >
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

      <PostContent :content-json="(post.content as object | null) ?? null" />
    </div>
  </BaseCard>
</template>
