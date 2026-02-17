<!--
TODO: Header 组件优化清单
3. [功能] 实现当前路由高亮
   - 引入 useRoute 获取当前路由
   - 为激活的导航项添加视觉反馈(如背景色、文字颜色)

4. [响应式] 移动端适配优化
   - 小屏幕(<768px)时隐藏导航栏,显示汉堡菜单
   - 实现移动端侧边栏导航

5. [无障碍] 提升可访问性
   - 为 header 添加 aria-label="主导航"
   - 为导航按钮添加 aria-current="page" 标识当前页
   - 确保键盘导航支持

6. [性能] 考虑添加 sticky 定位
   - 评估是否需要滚动时固定在顶部
   - 添加滚动时的背景模糊效果

7. [体验] 搜索功能增强
   - 添加搜索快捷键提示(如 Cmd+K)
   - 考虑搜索结果预览
-->
<script lang="ts" setup>
import ToggleLanguage from "@/components/theme/ToggleLanguage.vue";
import ToggleTheme from "@/components/theme/ToggleTheme.vue";
import ToggleColor from "@/components/theme/ToggleColor.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import HeaderSearch from "@/components/base/search/HeaderSearch.vue";
import { useLang } from "@/composables/lang.hook";
import { useRouter } from "vue-router";
import { computed } from "vue";

const { t } = useLang();
const router = useRouter();

// TODO: 目前还没开发“归档”和“关于”页面，暂时使用show页面作为占位符，后续开发完毕后再替换
const navItems = computed(() => [
  { name: "home", label: t("components.common.layout.Header.nav.home") },
  { name: "show", label: t("components.common.layout.Header.nav.archive") }, // TODO: 将路由名改为 archive
  { name: "show", label: t("components.common.layout.Header.nav.about") }, // TODO: 将路由名改为 about
]);

const handleNavClick = (routeName: string) => {
  router.push({ name: routeName });
};
</script>
<template>
  <header>
    <!-- 核心尺寸与居中 | 内部布局 | 背景与边框 -->
    <div class="w-full md:max-w-[1200px] md:w-[95%] mx-auto h-18 flex items-center justify-between bg-bg-card rounded-b-2xl shadow-sm">
      <!-- 左侧搜索区域 -->
      <div class="ml-4">
        <HeaderSearch />
      </div>

      <!-- 中间导航栏区域 -->
      <nav class="flex items-center gap-2">
        <ButtonSecondary
          v-for="item in navItems"
          :key="item.name"
          :text="item.label"
          class="h-11 px-4"
          @click="handleNavClick(item.name)"
        >
        </ButtonSecondary>
      </nav>

      <!-- 右侧按钮区域 -->
      <div class="flex items-center mr-4 gap-2">
        <ToggleColor />
        <ToggleTheme />
        <ToggleLanguage />
      </div>
    </div>
  </header>
</template>
