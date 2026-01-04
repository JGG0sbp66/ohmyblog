<!-- src/components/common/layout/Footer.vue -->
<script setup lang="ts">
import { RiGithubLine, RiTwitterXFill, RiRssFill } from '@remixicon/vue';

const currentYear = new Date().getFullYear();
</script>

<template>
    <!-- TODO: 页脚demo，后续再优化 -->
    <footer class="w-full bg-bg-page border-t border-text-main/5 transition-colors duration-200">
        <div class="max-w-250 mx-auto py-10 px-6">

            <div class="flex flex-col items-center gap-4">

                <!-- 社交链接 -->
                <div class="flex items-center gap-5 text-text-icon">
                    <a href="https://github.com/yourname" target="_blank" class="hover:text-primary transition-colors">
                        <RiGithubLine class="w-5 h-5" />
                    </a>
                    <a href="#" class="hover:text-primary transition-colors">
                        <RiTwitterXFill class="w-4 h-4" />
                    </a>
                    <a href="/rss.xml" class="hover:text-primary transition-colors">
                        <RiRssFill class="w-4 h-4" />
                    </a>
                </div>

                <!-- 版权与驱动信息 -->
                <div class="flex flex-col items-center gap-1.5 text-sm text-text-icon/60 text-center">
                    <p>© {{ currentYear }} <span class="font-medium text-text-main">YourName's Blog</span></p>
                    <p class="text-xs opacity-80">
                        Powered by <a href="https://vuejs.org/" target="_blank" class="hover:text-primary">Vue</a>
                        & <a href="https://vitejs.dev/" target="_blank" class="hover:text-primary">Vite</a>
                    </p>
                </div>

                <!-- 备案信息 (如果不涉及国内服务器可直接删除整个 div) -->
                <!-- 
        <div class="text-[10px] text-text-icon/40">
          <a href="https://beian.miit.gov.cn/" target="_blank" class="hover:underline">
            浙ICP备XXXXXXXX号
          </a>
        </div> 
        -->

            </div>
        </div>
    </footer>
</template>