<!-- src/views/main/components/hero/editors/title/HeroMainTitleEditor.vue -->
<script setup lang="ts">
import TipInput from "@/components/common/input/TipInput.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";

const { t } = useLang();

// 主标题直接绑定到 store，输入即改内存态配置。
const systemStore = useSystemStore();
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-bold tracking-wide text-fg-subtle uppercase">
        {{ t("views.main.hero.titleEditor.mainTitle") }}
      </h3>
    </div>

    <TipInput
      v-model="systemStore.personalInfo.heroTitle"
      :placeholder="t('views.main.hero.titleEditor.placeholder')"
    />
  </div>
</template>
