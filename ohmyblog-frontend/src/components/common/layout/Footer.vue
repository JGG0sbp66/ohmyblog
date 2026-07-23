<!-- src/components/common/layout/Footer.vue -->
<script setup lang="ts">
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import FooterBrand from "@/components/common/layout/footer/FooterBrand.vue";
import FooterLinks from "@/components/common/layout/footer/FooterLinks.vue";
import FooterToolbar from "@/components/common/layout/footer/FooterToolbar.vue";

const [footerContentRef] = useAutoAnimate();
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
        <FooterBrand />
        <!-- 右栏：分组链接 -->
        <FooterLinks />
      </div>

      <!-- 下半部分：底部栏 -->
      <FooterToolbar />
    </div>
  </footer>
</template>
