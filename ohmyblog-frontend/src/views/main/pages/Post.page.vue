<!-- src/views/main/pages/Post.page.vue -->
<script setup lang="ts">
import { ref, shallowRef, computed, watch } from "vue";
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
import PostToc from "@/views/main/components/post/toc/PostToc.vue";
import type { TocHeading } from "@/views/main/components/post/toc/extract-headings";

const route = useRoute();
const router = useRouter();
const { t } = useLang();

const slug = computed(() => route.params.slug as string);
const post = ref<PublicPostDetail | null>(null);
const loading = ref(false);
const notFound = ref(false);
/** 侧边目录的数据源；元素引用不需要被包成响应式代理，用 shallowRef */
const headings = shallowRef<TocHeading[]>([]);

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
  // 先清空，避免切换文章时目录残留上一篇的标题
  headings.value = [];
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

    lg 起在右侧让出一列给目录（lg~xl 目录收窄到 w-48 给正文留宽，xl 起恢复 w-60，
    正文 1200 → 约 970px，长文行宽反而更舒服）；
    小于 lg 时目录整列隐藏，正文照旧全宽，wrapper 只剩一个子项，
    上面那段负 margin 的推演不受影响。
  -->
  <div v-else-if="post" class="-mx-4 flex flex-row items-start gap-7 md:mx-0">
    <div class="min-w-0 flex-1">
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

          <PostContent
            :content-html="post.contentHtml ?? ''"
            @headings="headings = $event"
          />
        </div>
      </BaseCard>
    </div>

    <!-- mt-30：让目录从标题区下方起步，避免和返回按钮／标题齐平；
         滚动后由 sticky top-24 接管（与 MainLayout 侧栏同一个吸顶位） -->
    <PostToc
      :headings="headings"
      class="sticky top-24 mt-30 hidden w-48 shrink-0 lg:block xl:w-60"
    />
  </div>
</template>
