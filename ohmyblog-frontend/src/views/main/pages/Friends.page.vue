<!-- src/views/main/pages/Friends.page.vue -->
<!--
  友链页面。
  拉取已通过的友链列表并以网格形式展示；底部提供友链申请表单。
-->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import BaseCard from "@/components/base/card/BaseCard.vue";
import Loading from "@/components/common/item/Loading.vue";
import FriendLinkLayout from "@/views/main/components/friends/FriendLinkLayout.vue";
import FriendLinkApplyForm from "@/views/main/components/friends/form/FriendLinkApplyForm.vue";
import {
  getApprovedFriendLinks,
  type FriendLinkItem,
} from "@/api/friend-link.api";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();

const links = ref<FriendLinkItem[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const data = await getApprovedFriendLinks();
    links.value = (data as any)?.list ?? [];
  } catch {
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <!--
    根容器 -mx-4 md:mx-0：移动端整体破出 main 的 px-4 让卡片贴边。
    移动端 gap-0：两卡片直接拼接，相邻圆角拉直、中间用点状分割线分隔
    （见 <style>），桌面端恢复 gap-6 与各自独立的 rounded-3xl 圆角。
  -->
  <div class="flex flex-col gap-0 md:gap-6 -mx-4 md:mx-0">
    <!-- 友链列表（圆角由 <style> 统一控制，不用 Tailwind rounded 工具类，避免层叠层冲突） -->
    <BaseCard padding="default" class="friends-list-card onload-animation">
      <!-- 标题行 -->
      <div class="flex items-center gap-2 mb-6">
        <h2 class="text-xl font-bold text-fg">
          {{ t("views.main.friends.listTitle") }}
        </h2>
        <span class="text-xs text-fg-subtle/60 ml-auto">
          {{ t("views.main.friends.siteCount", { count: links.length }) }}
        </span>
      </div>

      <div v-if="loading" class="flex justify-center py-10">
        <Loading sizeClass="w-7 h-7" colorClass="text-accent" />
      </div>
      <FriendLinkLayout v-else :links="links" />
    </BaseCard>

    <!-- 申请友链卡片（SettingCard 在组件内部管理），圆角同样交给 <style> -->
    <FriendLinkApplyForm
      class="friends-apply-card onload-animation anim-delay-200"
    />
  </div>
</template>

<style scoped>
/*
  圆角统一在此控制，不用 Tailwind 的 rounded-* 工具类。
  原因：Tailwind v4 把工具类放进 @layer utilities（层叠层），
  层内的 !important 会压过 scoped <style> 里无层的 !important，
  导致之前 border-radius 拉直无效。改用无层普通声明即可稳定胜出。
*/
.friends-list-card,
.friends-apply-card {
  border-radius: var(--radius-2xl, 1rem);
}

@media (width >= 48rem) {
  .friends-list-card,
  .friends-apply-card {
    border-radius: var(--radius-3xl, 1.5rem);
  }
}

@media (width < 48rem) {
  /* 上卡片下边两角拉直，与下卡片拼接 */
  .friends-list-card {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  /* 下卡片上边两角拉直，并承载中间的点状分割线 */
  .friends-apply-card {
    position: relative;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  /* 与首页卡间一致的点状分割线 */
  .friends-apply-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 1rem;
    right: 1rem;
    z-index: 1;
    height: 1px;
    background-image: radial-gradient(
      circle,
      color-mix(in oklab, var(--color-fg-muted) 28%, transparent) 1px,
      transparent 1px
    );
    background-size: 4px 1px;
    background-repeat: repeat-x;
  }
}
</style>
