<!-- src/components/common/layout/footer/FooterBrand.vue -->
<script setup lang="ts">
import { useSystemStore } from "@/stores/system.store";
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useLang } from "@/composables/lang.hook";
import { useViewerCount } from "@/composables/viewer-count.hook";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import { formatCopyrightYear } from "@/utils/date";

const systemStore = useSystemStore();
const { siteInfo } = storeToRefs(systemStore);
const { t } = useLang();
const router = useRouter();

const { viewerCount, isConnected } = useViewerCount();

const [containerRef] = useAutoAnimate();

// 版权年份
const copyrightYear = computed(() =>
  formatCopyrightYear(systemStore.siteCreatedAt),
);

// 点击标题：平滑滚动到顶部并导航回首页
function scrollToTopAndGoHome() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (router.currentRoute.value.path !== "/") {
    router.push("/");
  }
}
</script>

<template>
  <div ref="containerRef" class="flex flex-col gap-2 md:max-w-72">
    <!-- 页脚标题 -->
    <h2
      v-if="siteInfo.footerTitle"
      class="text-xl font-bold text-fg cursor-pointer transition-opacity hover:opacity-70"
      @click="scrollToTopAndGoHome"
    >
      {{ siteInfo.footerTitle }}
    </h2>

    <!-- 页脚标语 -->
    <p
      v-if="siteInfo.footerSlogan"
      class="text-[13px] text-fg-muted italic leading-relaxed"
    >
      {{ siteInfo.footerSlogan }}
    </p>

    <!-- 版权信息：有 footer 文本时才显示 -->
    <p
      v-if="siteInfo.footer"
      class="text-[13px] text-fg-muted/70 mt-2 leading-relaxed"
    >
      <span>&copy; {{ copyrightYear }}</span>
      <span class="ml-1">{{ siteInfo.footer }}</span>
    </p>

    <!-- 在线浏览人数 -->
    <p
      class="text-[13px] text-fg-muted/70 mt-1 leading-relaxed flex items-center gap-1.5"
    >
      <!-- 外框尺寸必须贴合圆点本体：若为光环预留空间（size-3），圆点左侧会多出
           3px 空白，导致它比页脚其它文字行内缩 3px、且与文案间距变成 9px。
           光环用 inset-0 撑满后向外扩散，溢出外框不影响布局 -->
      <span class="relative flex size-[6px] shrink-0">
        <span
          v-if="isConnected"
          class="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-75"
        />
        <span
          class="relative size-full rounded-full"
          :class="isConnected ? 'bg-green-500' : 'bg-red-400'"
        />
      </span>
      <span v-if="isConnected">
        {{
          t("components.common.layout.Footer.viewerCount", {
            count: viewerCount,
          })
        }}
      </span>
      <span v-else>
        {{ t("components.common.layout.Footer.offline") }}
      </span>
    </p>
  </div>
</template>
