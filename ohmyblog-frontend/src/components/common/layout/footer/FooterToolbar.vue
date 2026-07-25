<!-- src/components/common/layout/footer/FooterToolbar.vue -->
<script setup lang="ts">
import { useSystemStore } from "@/stores/system.store";
import { storeToRefs } from "pinia";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import ButtonThird from "@/components/base/button/ButtonThird.vue";
import ToggleLanguage from "@/components/theme/ToggleLanguage.vue";
import ToggleTheme from "@/components/theme/ToggleTheme.vue";
import ToggleColor from "@/components/theme/ToggleColor.vue";
import { useLang } from "@/composables/lang.hook";

const { siteInfo } = storeToRefs(useSystemStore());
const { t } = useLang();
const [toolbarRef] = useAutoAnimate();
</script>

<template>
  <div
    ref="toolbarRef"
    class="mt-8 pt-4 border-t border-fg-muted/10 flex flex-col md:flex-row items-center justify-between gap-3 text-[13px] text-fg-muted/60"
  >
    <!-- 左侧：链接组 + 开关组；移动端上下两行堆叠，桌面端并排一行 -->
    <div class="flex flex-col md:flex-row items-center gap-2 md:gap-1">
      <!-- A 组：RSS 订阅 · 站点地图 -->
      <div class="flex items-center gap-1">
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
      </div>

      <!-- A / B 分隔符：仅桌面端并排时显示 -->
      <span class="hidden md:inline text-fg-muted/30 mx-1">|</span>

      <!-- B 组：主题色 | 主题 | 语言 -->
      <div class="flex items-center gap-1 flex-wrap justify-center">
        <!-- 主题色 -->
        <ToggleColor />

        <span class="text-fg-muted/30 mx-1">|</span>

        <!-- 主题切换 -->
        <ToggleTheme />

        <span class="text-fg-muted/30 mx-1">|</span>

        <!-- 语言切换 -->
        <ToggleLanguage />
      </div>
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
</template>
