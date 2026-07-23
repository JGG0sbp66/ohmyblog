<!-- src/components/common/layout/footer/FooterBrand.vue -->
<script setup lang="ts">
import { useSystemStore } from "@/stores/system.store";
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useLang } from "@/composables/lang.hook";
import { useViewerCount } from "@/composables/viewer-count.hook";
import { formatCopyrightYear } from "@/utils/date";

const systemStore = useSystemStore();
const { siteInfo } = storeToRefs(systemStore);
const { t } = useLang();
const router = useRouter();

const { viewerCount, isConnected } = useViewerCount();

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
  <div class="flex flex-col gap-2 md:max-w-72">
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
    <p class="text-[13px] text-fg-muted/70 mt-1 leading-relaxed flex items-center gap-1.5">
      <span class="relative inline-flex items-center justify-center size-3">
        <span
          v-if="isConnected"
          class="absolute inline-flex size-[6px] animate-ping rounded-full bg-green-400 opacity-75"
        />
        <span
          class="relative inline-flex size-[6px] rounded-full"
          :class="isConnected ? 'bg-green-500' : 'bg-red-400'"
        />
      </span>
      <span v-if="isConnected">
        {{ t('components.common.layout.Footer.viewerCount', { count: viewerCount }) }}
      </span>
      <span v-else>
        {{ t('components.common.layout.Footer.offline') }}
      </span>
    </p>
  </div>
</template>
