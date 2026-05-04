<!-- src/views/admin/components/layout/AuthLayout.vue -->
<!--
  认证类页面共用布局
  - 全屏 flex 居中
  - 左：TypingBrand 品牌打字
  - 右：BaseCard 卡片，内容由 default slot 填充
  使用方：Login / ForgotPassword 等无需 AdminLayout 包裹的认证页面
-->
<script setup lang="ts">
import BaseCard from "@/components/base/card/BaseCard.vue";
import Brand from "@/components/common/item/Brand.vue";

defineProps<{
  /** 品牌打字三行文案 */
  brandLine1: string;
  brandLine2: string;
  brandLine3: string;
}>();
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-bg overflow-x-hidden overflow-y-clip"
  >
    <main class="flex-1 flex flex-col p-8 gap-10">
      <div class="flex-1 flex items-center justify-center">
        <div class="w-full max-w-5xl flex items-center justify-center gap-12">
          <!-- 左：品牌展示 -->
          <div class="hidden lg:block w-full onload-animation">
            <Brand
              :line1="brandLine1"
              :line2="brandLine2"
              :line3="brandLine3"
            />
          </div>

          <!-- 右：卡片，内容由父组件提供 -->
          <BaseCard class="max-w-122 onload-animation anim-delay-100">
            <slot />
          </BaseCard>
        </div>
      </div>
    </main>
  </div>
</template>
