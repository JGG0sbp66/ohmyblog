<!-- src/views/main/components/HeroSection.vue -->
<!--
TODO: Hero 组件功能增强清单

1. [内容层] 添加文字覆盖层
   - 主标题：可自定义字体、大小、颜色
   - 副标题：支持打字机效果
   - 多个副标题轮换显示（类似 Typed.js）
   - 文字位置可配置（居中、左对齐、右对齐）

2. [标签系统] 右下角胶囊标签
   - 显示分类、标签等信息
   - 管理员可见编辑按钮
   - 点击可快速编辑和添加标签
   - 标签样式可自定义（颜色、圆角等）

3. [管理功能] 管理员快捷编辑
   - 管理员登录时显示编辑按钮
   - 点击进入 Hero 配置页面
   - 支持实时预览修改效果

4. [视觉效果] 增强视觉体验
   - 背景图片视差滚动效果
   - 渐变遮罩层可配置
   - 动画效果（淡入、滑入等）
   - 响应式字体大小

5. [性能优化] 图片加载优化
   - 支持多尺寸响应式图片
   - 懒加载和渐进式加载
   - WebP 格式支持
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSystemStore } from "@/stores/system.store";

const systemStore = useSystemStore();

// 从 store 获取背景图片
const heroImage = computed(() => systemStore.personalInfo.hero);

// Banner 动画控制
const heroRef = ref<HTMLElement | null>(null);

onMounted(() => {
  // 页面加载后触发 Banner 动画
  setTimeout(() => {
    if (heroRef.value) {
      heroRef.value.classList.remove("banner-initial");
      heroRef.value.classList.add("banner-show");
    }
  }, 100);
});
</script>

<template>
  <!-- 直接使用 vh 单位，不设置 min-h -->
  <section class="w-full h-[65vh] overflow-hidden">
    <!-- 使用 img 标签 + object-fit + Banner 动画 -->
    <img
      v-if="heroImage"
      ref="heroRef"
      :src="heroImage"
      alt="Hero banner image"
      class="w-full h-full object-cover object-center banner-initial"
      loading="lazy"
      decoding="async"
    />

    <!-- 无背景图时的占位背景 -->
    <div
      v-else
      class="w-full h-full bg-linear-to-br from-accent/20 via-bg to-accent/10 flex items-center justify-center"
    >
      <p class="text-fg-muted text-lg">暂无 Hero 图片</p>
    </div>
  </section>
</template>
