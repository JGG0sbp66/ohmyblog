<!-- 
  src/views/main/components/hero/editors/title/subtitle/SubtitleEmptyState.vue 
  副标题列表为空时的展示状态。
-->
<script setup lang="ts">
import Trash from "@/components/icon/common/Trash.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();
</script>

<template>
  <div
    class="rounded-2xl border-2 border-dashed border-fg-subtle/10 bg-fg-subtle/2 px-4 py-10 text-center"
  >
    <div class="mb-2 flex justify-center opacity-20">
      <Trash class="h-8 w-8" />
    </div>
    <p class="text-sm text-fg-muted/60">
      {{ t("views.main.hero.titleEditor.subtitles.empty") }}
    </p>
  </div>
</template>
