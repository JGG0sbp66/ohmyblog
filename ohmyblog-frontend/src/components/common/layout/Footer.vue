<!-- src/components/common/layout/Footer.vue -->
<script setup lang="ts">
import { useSystemStore } from "@/stores/system.store";
import { storeToRefs } from "pinia";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";

const systemStore = useSystemStore();
const { siteInfo } = storeToRefs(systemStore);

const currentYear = new Date().getFullYear();

// 使用 auto-animate 自动处理备案信息的显示/隐藏动画
const [footerContentRef] = useAutoAnimate();
</script>

<template>
  <footer class="w-full bg-bg">
    <div class="w-2/3 mx-auto border-t border-fg-muted/10"></div>

    <div class="max-w-250 mx-auto py-4 px-6">
      <div ref="footerContentRef" class="flex flex-col items-center gap-1">
        <!-- 版权与驱动信息 -->
        <div
          class="flex flex-col items-center gap-1.5 text-sm text-fg-muted text-center"
        >
          <div
            class="flex items-center flex-wrap justify-center leading-relaxed"
          >
            <span> © {{ currentYear }} </span>
            <ButtonSecondary
              :text="siteInfo.title || 'ohmyblog'"
              class="h-7! font-medium text-fg-subtle/60!"
            />

            <span v-if="siteInfo.footer">
              {{ siteInfo.footer }}
            </span>
          </div>
        </div>

        <!-- 备案信息 -->
        <a
          v-if="siteInfo.icp"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          class="h-7 flex justify-center"
        >
          <ButtonSecondary
            :text="siteInfo.icp"
            class="h-7! text-[10px]! text-fg-subtle/60! font-normal!"
          />
        </a>
      </div>
    </div>
  </footer>
</template>
