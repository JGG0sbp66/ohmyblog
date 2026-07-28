<script setup lang="ts">
/**
 * 系统信息卡片 — 展示 health 接口返回的版本号与 commit hash
 * 放置在灵感速记卡片下方
 */
import { onMounted, ref } from "vue";
import {
  CircleCheck,
  CircleFadingArrowUp,
  ExternalLink,
  GitCommitHorizontal,
  Tag,
} from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { checkUpdate } from "@/api/health.api";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { useSystemStore } from "@/stores/system.store";
import SettingCard from "@/components/base/card/SettingCard.vue";

const { t } = useLang();

const loading = ref(true);
const checkingUpdate = ref(false);
const updateInfo = ref<Awaited<ReturnType<typeof checkUpdate>> | null>(null);

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

async function handleCheckUpdate() {
  checkingUpdate.value = true;
  try {
    updateInfo.value = await checkUpdate();
  } catch {
    useToast.error(t("views.admin.Dashboard.systemInfo.checkFailed"));
  } finally {
    checkingUpdate.value = false;
  }
}

function openRelease() {
  if (!updateInfo.value?.releaseUrl) return;
  window.open(updateInfo.value.releaseUrl, "_blank", "noopener,noreferrer");
}
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

      <div
        v-if="updateInfo"
        class="flex items-start gap-2 border-t border-border pt-3"
        :class="updateInfo.hasUpdate ? 'text-accent' : 'text-fg-muted'"
      >
        <CircleFadingArrowUp
          v-if="updateInfo.hasUpdate"
          class="mt-0.5 h-4 w-4 shrink-0"
        />
        <CircleCheck v-else class="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {{
            updateInfo.hasUpdate
              ? t("views.admin.Dashboard.systemInfo.updateAvailable", {
                  version: updateInfo.latestVersion,
                })
              : t("views.admin.Dashboard.systemInfo.upToDate")
          }}
        </span>
      </div>

      <div class="flex justify-end pt-1">
        <ButtonSecondary
          v-if="updateInfo?.hasUpdate"
          :text="t('views.admin.Dashboard.systemInfo.viewRelease')"
          @click="openRelease"
        >
          <ExternalLink class="h-4 w-4" />
        </ButtonSecondary>
        <ButtonPrimary
          v-else
          :text="t('views.admin.Dashboard.systemInfo.checkUpdate')"
          :loading="checkingUpdate"
          @click="handleCheckUpdate"
        />
      </div>
    </div>
  </SettingCard>
</template>
