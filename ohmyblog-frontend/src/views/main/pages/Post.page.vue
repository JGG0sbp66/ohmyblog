<!-- src/views/main/pages/Post.page.vue -->
<script setup lang="ts">
import { ref, shallowRef, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMediaQuery } from "@vueuse/core";
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
/** 侧边目录的数据源；元素引用不需要被包成响应式代理，用 shallowRef */
const headings = shallowRef<TocHeading[]>([]);

/**
 * 页边目录只在 xl（80rem = 1280px）以上出现 —— 再窄下去卡片两侧的空白
 * 放不下一列可读的文字，目录就会压到正文上。
 *
 * 用媒体查询而不是 CSS 的 hidden xl:block：CSS 隐藏只是不画，组件照样挂载，
 * 里面的 scroll / resize / ResizeObserver 监听在手机上会一直空转。
 */
const railVisible = useMediaQuery("(min-width: 80rem)");

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

/**
 * 请求序号守卫：A→B 快速切文章时，A 的响应可能比 B 的还晚到 —— 不拦的话
 * 旧响应会覆盖新文章的内容；A 的 404 迟到更糟，会把用户从存在的文章页
 * 踢进 404。每次 fetch 自增序号，响应回来时序号已不是自己的就整批丢弃
 * （loading 与 404 跳转一并归最新请求所有）
 */
let fetchSeq = 0;

const fetchPost = async () => {
  const seq = ++fetchSeq;
  loading.value = true;
  // 先清空，避免切换文章时目录残留上一篇的标题
  headings.value = [];
  try {
    const result = await getPublicPostBySlug(slug.value);
    if (seq !== fetchSeq) return;
    post.value = (result as any)?.post ?? null;
  } catch {
    if (seq !== fetchSeq) return;
    post.value = null;
  } finally {
    if (seq === fetchSeq) loading.value = false;
  }

  // 文章不存在：跳转到统一 404 页。
  // 用 replace + pathMatch 携带当前路径，地址栏 URL 保持不变，方便用户直接修正 slug。
  if (!post.value) {
    await router.replace({
      name: "not-found",
      params: { pathMatch: route.path.substring(1).split("/") },
      query: route.query,
      hash: route.hash,
    });
  }
};

watch(slug, fetchPost, { immediate: true });
</script>

<template>
  <!-- Loading state -->
  <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
    <Loading size-class="w-6 h-6" color-class="text-fg-subtle" />
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

    目录不再占一列：它绝对定位在卡片左侧的页边空白里（见下方注释），
    所以这里不需要行 flex，wrapper 只有一个子项，上面那段负 margin 的推演不变。

    max-w-[52rem]：正文行宽的上限。之前正文宽度是「1200 减掉目录那一列」的余数
    （约 868px ≈ 86 字符），目录移出文档流后若不封顶就会涨到 1130px 上下，
    行宽越过可读区间（一般认为 45~75 字符），眼睛回行开始丢行。封在 52rem 后
    正文约 768px ≈ 76 字符，同时把省下的宽度全部让给两侧页边 —— 这才是目录
    「不占文章」的正确兑现方式：不是把宽度还给文字，而是变成对称的呼吸空间。
  -->
  <div v-else-if="post" class="-mx-4 md:mx-0">
    <div class="relative mx-auto max-w-[52rem]">
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
            :subtitle="post.subtitle ?? null"
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

      <!--
        页边目录：绝对定位在卡片左侧的空白里，不占文档流宽度。

        right-full + mr-7：右边缘贴住卡片左边缘再退开 1.75rem，所以它跟着卡片走，
        不需要知道视口有多宽。

        top-48 bottom-0：目录列从卡片顶部下方 12rem 处开始——跳过返回按钮 + PostHeader
        那段（约 150~200px）。这个偏移让目录的「自然起始位置」与正文第一行对齐：
        1. hero 还在视口时，目录也在 hero 下方（因为卡片本身就在 hero 后面，
           目录又从卡片内偏下位置开始），不会浮到彩色照片上面；
        2. 开始滚动后，sticky top-24 把目录钉在 header 下方——和 Jinkang's Notes
           那种「初始在 hero 下方、滚动后固定在顶部」的效果一致。
        3. bottom-0 保证列延伸到卡片底部，给 sticky 足够长的轨道。

        宽度按可用页边给：卡片封在 52rem 后，xl(1280) 处左侧空白约 224px，
        w-44(176) + mr-7(28) = 204 刚好放得下；2xl 起空白 350px 以上，放宽到 w-60。
        小于 xl 时整块不渲染（railVisible），而不是 CSS 隐藏 —— 否则
        useReadingPosition 的 scroll/resize/ResizeObserver 在手机上照样跑，纯浪费。

        pointer-events-none：这一列和卡片一样高，但目录本身只有几行。
        不关掉的话，整条空白都会成为悬停靶区，指针还在页面边缘就把目录展开了。
      -->
      <div
        v-if="railVisible"
        class="pointer-events-none absolute top-48 right-full bottom-0 mr-7 w-44 2xl:w-60"
      >
        <PostToc
          :headings="headings"
          class="pointer-events-auto sticky top-24"
        />
      </div>
    </div>
  </div>
</template>
