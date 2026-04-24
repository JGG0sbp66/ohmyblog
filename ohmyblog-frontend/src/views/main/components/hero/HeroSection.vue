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
import HeroImageEditor from "./HeroImageEditor.vue";
import HeroTitleEditor from "./HeroTitleEditor.vue";
import HeroImageTransition from "./HeroImageTransition.vue";

const systemStore = useSystemStore();

// 从 store 获取背景图片
const heroImage = computed(() => systemStore.personalInfo.hero);

// Banner 动画控制 (声明式)
const isBannerVisible = ref(false);

onMounted(() => {
  // 页面加载后触发
  setTimeout(() => {
    isBannerVisible.value = true;
  }, 100);
});
</script>

<template>
  <!-- 只在有 hero 图时才渲染整个 section -->
  <section
    v-if="heroImage"
    id="hero"
    class="relative h-[65vh] w-full overflow-hidden onload-animation"
  >
    <!-- 使用专用的 Hero 过渡组件 -->
    <HeroImageTransition
      :src="heroImage"
      :show="isBannerVisible"
      alt="Hero banner image"
      :duration="1000"
      class="w-full h-full"
    />

    <div class="absolute bottom-6 right-6 z-20 flex items-center gap-3">
      <!-- Hero 图片编辑按钮 -->
      <HeroImageEditor />
      <!-- Hero 标题编辑按钮 -->
      <HeroTitleEditor />
    </div>
  </section>
</template>

<style scoped>
</style>

