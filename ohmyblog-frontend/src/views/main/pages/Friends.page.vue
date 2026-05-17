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
    根容器 -mx-4 md:mx-0：移动端整体破出 main 的 px-4 让卡片贴边；
    每个卡片在移动端 rounded-2xl，桌面端恢复 BaseCard 默认 rounded-3xl。
  -->
  <div class="flex flex-col gap-6 -mx-4 md:mx-0">
    <!-- 友链列表 -->
    <BaseCard
      padding="default"
      class="onload-animation rounded-2xl! md:rounded-3xl!"
    >
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

    <!-- 申请友链卡片（SettingCard 在组件内部管理） -->
    <FriendLinkApplyForm
      class="onload-animation anim-delay-200 rounded-2xl! md:rounded-3xl!"
    />
  </div>
</template>
