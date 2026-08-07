<!-- src/views/main/components/MainLayout.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/common/layout/Header.vue";
import Footer from "@/components/common/layout/Footer.vue";
import HeroSection from "@/views/main/components/hero/HeroSection.vue";
import ProfileCard from "@/components/common/item/ProfileCard.vue";
import AnnouncementCard from "@/views/main/components/announcement/AnnouncementCard.vue";
import { useSystemStore } from "@/stores/system.store";

const systemStore = useSystemStore();
const route = useRoute();

// 文章详情页与 404 页不展示侧边栏，让内容独占整行宽度
const showSidebar = computed(
  () => route.name !== "post" && route.name !== "not-found",
);

// 404 页内容很矮，撑不满一屏。默认布局下它会顶在上方、下方留一大片空白，
// 同时自身的 min-height 又叠加在 header/hero/footer 之上把整页顶出滚动条。
// 这里改成让内容区吃满 header 与 footer 之间的剩余高度，由页面自己做垂直居中，
// 高度由 flex 分配而非视口比例，因此有无 hero 图都成立。
const fillHeight = computed(() => route.name === "not-found");
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <Header />
    <HeroSection />

    <!-- 主体内容区域：限制最大宽度并水平居中 -->
    <main
      id="content-wrapper"
      :class="[
        'flex-1 w-full md:max-w-300 md:w-[95%] mx-auto relative z-10 px-4 md:px-0 mb-12',
        systemStore.personalInfo.hero ? 'mt-4' : 'mt-28',
        fillHeight ? 'flex flex-col' : '',
      ]"
    >
      <!-- 两栏布局：左侧侧边栏 + 右侧内容区（侧边栏仅桌面端显示） -->
      <div
        class="flex flex-col md:flex-row gap-7"
        :class="fillHeight ? 'flex-1 items-stretch' : 'items-start'"
      >
        <!-- 侧边栏 (Widgets) - 移动端隐藏；文章详情页不显示 -->
        <aside
          v-if="showSidebar"
          class="hidden md:flex md:w-70 flex-col gap-7 sticky top-24 order-1 sidebar"
        >
          <div class="onload-animation">
            <ProfileCard />
          </div>
          <div class="onload-animation">
            <AnnouncementCard />
          </div>
          <!-- 未来可以在此处添加更多侧边栏组件 -->
        </aside>

        <!-- 主要内容 (router-view) -->
        <!-- min-w-0：行 flex 子项默认 min-width:auto=min-content，宽表格/代码块会把本列
             撑到 min-content 宽度从而横向撑破整页。置 0 让本列可收缩，超宽内容回到各自
             的 overflow-x 容器（如 .tableWrapper）内部滚动。 -->
        <div
          class="flex-1 w-full min-w-0 order-2"
          :class="fillHeight ? 'flex flex-col' : ''"
        >
          <div
            class="onload-animation"
            :class="fillHeight ? 'flex flex-1' : ''"
          >
            <router-view />
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>
