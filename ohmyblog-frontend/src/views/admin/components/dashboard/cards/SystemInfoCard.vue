<script setup lang="ts">
/**
 * 系统信息卡片 — 展示 health 接口返回的版本号与 commit hash
 * 放置在灵感速记卡片下方
 */
import { onMounted, ref } from "vue";
import { GitCommitHorizontal, Tag } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import SettingCard from "@/components/base/card/SettingCard.vue";

const { t } = useLang();

const loading = ref(true);

const systemStore = useSystemStore();
const { version, commit } = storeToRefs(systemStore);

onMounted(async () => {
  loading.value = true;
  // 路由守卫可能已缓存 initialized，commit 为空时强制刷新一次
  if (!version.value || !commit.value) {
    await systemStore.checkStatus(true);
  }
  loading.value = false;
});
</script>

<template>
  <SettingCard
    :title="t('views.admin.Dashboard.systemInfo.title')"
    :description="t('views.admin.Dashboard.systemInfo.description')"
  >
    <div v-if="loading" class="flex flex-col gap-3">
      <div class="h-5 w-2/3 rounded bg-bg-muted/40" />
      <div class="h-5 w-1/2 rounded bg-bg-muted/40" />
    </div>

    <div v-else class="flex flex-col gap-3 text-sm">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 text-fg-muted">
          <Tag class="w-4 h-4" />
          <span>{{ t("views.admin.Dashboard.systemInfo.version") }}</span>
        </div>
        <span class="font-mono font-semibold text-fg">
          {{ version || "--" }}
        </span>
      </div>

      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 text-fg-muted">
          <GitCommitHorizontal class="w-4 h-4" />
          <span>{{ t("views.admin.Dashboard.systemInfo.commit") }}</span>
        </div>
        <span class="font-mono font-semibold text-fg">
          {{ commit || "--" }}
        </span>
      </div>
    </div>
  </SettingCard>
</template>
