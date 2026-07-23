<!-- src/components/common/layout/Footer.vue -->
<script setup lang="ts">
import { useSystemStore } from "@/stores/system.store";
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import ButtonThird from "@/components/base/button/ButtonThird.vue";
import ToggleLanguage from "@/components/theme/ToggleLanguage.vue";
import ToggleTheme from "@/components/theme/ToggleTheme.vue";
import ToggleColor from "@/components/theme/ToggleColor.vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import { useLang } from "@/composables/lang.hook";
import { useViewerCount } from "@/composables/viewer-count.hook";
import { isExternalLink, normalizeInternalPath } from "@/utils/url";
import { formatCopyrightYear } from "@/utils/date";

const systemStore = useSystemStore();
const { siteInfo } = storeToRefs(systemStore);
const { t } = useLang();
const router = useRouter();

const [footerContentRef] = useAutoAnimate();
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
  <footer id="footer" class="w-full bg-bg onload-animation">
    <div
      ref="footerContentRef"
      class="w-full max-w-280 mx-auto py-10 px-6"
    >
      <!-- 上半部分：左右分栏 -->
      <div class="flex flex-col md:flex-row gap-10 md:gap-16">
        <!-- 左栏：品牌信息 -->
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

        <!-- 右栏：分组链接 -->
        <div
          v-if="siteInfo.footerLinks && siteInfo.footerLinks.length > 0"
          class="flex-1 flex flex-wrap gap-x-12 gap-y-6 md:gap-x-30 md:justify-end"
        >
          <div
            v-for="(group, gIndex) in siteInfo.footerLinks"
            :key="gIndex"
            class="flex flex-col gap-2"
          >
            <!-- 分组标题 -->
            <h3 class="text-[13px] font-semibold text-fg tracking-wide px-1">
              {{ group.title }}
            </h3>
            <!-- 分组链接：HTTP(S) 外链新窗口打开并显示箭头，其余链接走站内路由 -->
            <div class="flex flex-col gap-2">
              <div v-for="(link, lIndex) in group.links" :key="lIndex">
                <ButtonThird
                  :text="
                    isExternalLink(link.url) ? `${link.name} ↗` : link.name
                  "
                  :href="isExternalLink(link.url) ? link.url : undefined"
                  :to="
                    isExternalLink(link.url)
                      ? undefined
                      : normalizeInternalPath(link.url)
                  "
                  :target="isExternalLink(link.url) ? '_blank' : undefined"
                  :rel="
                    isExternalLink(link.url) ? 'noopener noreferrer' : undefined
                  "
                  class="text-[13px]!"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 下半部分：底部栏 -->
      <div
        class="mt-8 pt-4 border-t border-fg-muted/10 flex flex-col md:flex-row items-center justify-between gap-3 text-[13px] text-fg-muted/60"
      >
        <!-- 左侧：RSS 订阅 + 主题色 + 主题切换 + 语言切换 -->
        <div class="flex items-center gap-1 flex-wrap justify-center">
          <!-- RSS 订阅 -->
          <ButtonThird
            :text="t('components.common.layout.Footer.rssSubscribe')"
            href="/feed"
            target="_blank"
          />

          <span class="text-fg-muted/30">·</span>

          <!-- 站点地图 -->
          <ButtonThird
            :text="t('components.common.layout.Footer.sitemap')"
            href="/sitemap.xml"
            target="_blank"
          />

          <span class="text-fg-muted/30 mx-1">|</span>

          <!-- 主题色 -->
          <ToggleColor />

          <span class="text-fg-muted/30 mx-1">|</span>

          <!-- 主题切换 -->
          <ToggleTheme />

          <span class="text-fg-muted/30 mx-1">|</span>

          <!-- 语言切换 -->
          <ToggleLanguage />
        </div>

        <!-- 右侧：备案号 -->
        <ButtonThird
          v-if="siteInfo.icp"
          :text="siteInfo.icp"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
        />
      </div>
    </div>
  </footer>
</template>
