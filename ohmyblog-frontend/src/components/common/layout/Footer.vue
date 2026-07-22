<!-- src/components/common/layout/Footer.vue -->
<script setup lang="ts">
import { useSystemStore } from "@/stores/system.store";
import { storeToRefs } from "pinia";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import { useTheme } from "@/composables/theme.hook";
import { useLang } from "@/composables/lang.hook";
import { type TThemeMode, THEME_MODES } from "@/api/shared";

const systemStore = useSystemStore();
const { siteInfo } = storeToRefs(systemStore);
const { colorMode, setTheme } = useTheme();
const { t, locale, setLocale, SUPPORTED_LOCALES } = useLang();

const currentYear = new Date().getFullYear();

const [footerContentRef] = useAutoAnimate();

// 主题模式标签映射
const themeLabel = (mode: TThemeMode) =>
  t(`components.theme.ToggleTheme.${mode}`);
</script>

<template>
  <footer id="footer" class="w-full bg-bg onload-animation">
    <div class="w-2/3 mx-auto border-t border-fg-muted/10"></div>

    <div ref="footerContentRef" class="max-w-250 mx-auto py-10 px-6">
      <!-- 上半部分：左右分栏 -->
      <div class="flex flex-col md:flex-row gap-10 md:gap-16">
        <!-- 左栏：品牌信息 -->
        <div class="flex flex-col gap-2 md:max-w-72">
          <!-- 页脚标题 -->
          <h2 class="text-lg font-bold text-fg">
            {{ siteInfo.footerTitle || siteInfo.title || "ohmyblog" }}
          </h2>

          <!-- 页脚标语 -->
          <p
            v-if="siteInfo.footerSlogan"
            class="text-sm text-fg-muted italic leading-relaxed"
          >
            {{ siteInfo.footerSlogan }}
          </p>

          <!-- 版权信息 -->
          <p class="text-sm text-fg-muted/70 mt-2 leading-relaxed">
            <span>&copy; {{ currentYear }}</span>
            <span v-if="siteInfo.footer" class="ml-1">
              {{ siteInfo.footer }}
            </span>
          </p>
        </div>

        <!-- 右栏：分组链接 -->
        <div
          v-if="siteInfo.footerLinks && siteInfo.footerLinks.length > 0"
          class="flex-1 flex flex-wrap gap-x-12 gap-y-6 md:justify-end"
        >
          <div
            v-for="(group, gIndex) in siteInfo.footerLinks"
            :key="gIndex"
            class="flex flex-col gap-2 min-w-28"
          >
            <!-- 分组标题 -->
            <h3
              class="text-sm font-semibold text-fg tracking-wide"
            >
              {{ group.title }}
            </h3>
            <!-- 分组链接 -->
            <ul class="flex flex-col gap-1.5">
              <li v-for="(link, lIndex) in group.links" :key="lIndex">
                <a
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm text-fg-muted hover:text-primary transition-colors duration-200"
                >
                  {{ link.name }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 下半部分：底部栏 -->
      <div
        class="mt-8 pt-4 border-t border-fg-muted/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-fg-muted/60"
      >
        <!-- 左侧：主题切换 + 语言切换 -->
        <div class="flex items-center gap-3 flex-wrap justify-center">
          <!-- 主题切换 -->
          <div class="flex items-center gap-1">
            <button
              v-for="mode in THEME_MODES"
              :key="mode"
              class="px-1.5 py-0.5 rounded transition-colors duration-200"
              :class="
                colorMode === mode
                  ? 'text-fg font-medium'
                  : 'hover:text-fg-muted'
              "
              @click="setTheme(mode)"
            >
              {{ themeLabel(mode) }}
            </button>
          </div>

          <span class="text-fg-muted/30">|</span>

          <!-- 语言切换 -->
          <div class="flex items-center gap-1">
            <button
              v-for="lang in SUPPORTED_LOCALES"
              :key="lang.value"
              class="px-1.5 py-0.5 rounded transition-colors duration-200"
              :class="
                locale === lang.value
                  ? 'text-fg font-medium'
                  : 'hover:text-fg-muted'
              "
              @click="setLocale(lang.value)"
            >
              {{ lang.label }}
            </button>
          </div>
        </div>

        <!-- 右侧：备案号 -->
        <a
          v-if="siteInfo.icp"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-fg-muted transition-colors duration-200"
        >
          {{ siteInfo.icp }}
        </a>
      </div>
    </div>
  </footer>
</template>
