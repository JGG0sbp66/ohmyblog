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
    移动端文章全宽布局：用 width:auto 的外层 wrapper 承载 -mx-4，破出 main 的 px-4，
    让卡片在窄屏贴齐视口左右边缘、最大化正文宽度；桌面端 md:mx-0 复原。

    为什么 wrapper 用 width:auto 而不是直接给 BaseCard 加 -mx-4：
      BaseCard 自带 w-full（width:100%）是定宽，负 margin 只会把它整体左移、不会加宽，
      导致「左贴边、右留 2rem 空」的不对称（margin-right 对定宽元素不生效）。改用外层
      width:auto 元素：遇负 margin 会按「容器宽 + 2rem」扩展，BaseCard 再 w-full 撑满
      → 左右对称贴边。圆角 / 阴影保持 BaseCard 默认，不再做 rounded-none 之类的破坏。
    内层 padding 由 p-6 收到 p-4（窄屏），桌面仍 md:p-8。
  -->
  <div v-else-if="post" class="-mx-4 md:mx-0">
    <BaseCard
      padding="none"
      class="flex flex-col overflow-hidden onload-animation"
    >
      <div class="flex flex-col gap-5 p-4 md:p-8">
        <!-- Back button -->
        <ButtonSecondary
          :text="t('views.main.post.back')"
          @click="router.back()"
        >
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
  </div>
</template>
