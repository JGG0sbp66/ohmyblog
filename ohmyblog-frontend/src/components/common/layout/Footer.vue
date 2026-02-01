<!-- src/components/common/layout/Footer.vue -->
<script setup lang="ts">
import { useSystemStore } from "@/stores/system.store";
import { storeToRefs } from "pinia";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { vAutoAnimate } from "@formkit/auto-animate";

const systemStore = useSystemStore();
const { siteInfo } = storeToRefs(systemStore);

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="w-full bg-bg-page">
    <div class="w-2/3 mx-auto border-t border-text-main/5"></div>

    <div class="max-w-250 mx-auto py-4 px-6">
      <div class="flex flex-col items-center gap-1" v-auto-animate>
        <!-- 版权与驱动信息 -->
        <div
          class="transition-all duration-200 flex flex-col items-center gap-1.5 text-sm text-text-secondary text-center"
        >
          <div
            class="flex items-center flex-wrap justify-center leading-relaxed"
          >
            <span> © {{ currentYear }} </span>
            <ButtonSecondary
              :text="siteInfo.title || 'ohmyblog'"
              fit
              class="h-7! font-medium text-text-icon/60! transition-all duration-200"
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
            fit
            class="h-7! text-[10px]! text-text-icon/60! font-normal! transition-all duration-200"
          />
        </a>
      </div>
    </div>
  </footer>
</template>
