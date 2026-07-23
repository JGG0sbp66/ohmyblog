<!-- src/components/common/layout/footer/FooterToolbar.vue -->
<script setup lang="ts">
import { useSystemStore } from "@/stores/system.store";
import { storeToRefs } from "pinia";
import ButtonThird from "@/components/base/button/ButtonThird.vue";
import ToggleLanguage from "@/components/theme/ToggleLanguage.vue";
import ToggleTheme from "@/components/theme/ToggleTheme.vue";
import ToggleColor from "@/components/theme/ToggleColor.vue";
import { useLang } from "@/composables/lang.hook";

const { siteInfo } = storeToRefs(useSystemStore());
const { t } = useLang();
</script>

<template>
  <div
    class="mt-8 pt-4 border-t border-fg-muted/10 flex flex-col md:flex-row items-center justify-between gap-3 text-[13px] text-fg-muted/60"
  >
    <!-- 左侧：RSS 订阅 + 站点地图 + 主题色 + 主题切换 + 语言切换 -->
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
</template>
