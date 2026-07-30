<!-- src/components/theme/ToggleColor.vue -->
<script lang="ts" setup>
import { useTheme } from "@/composables/theme.hook";
import { Palette } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import FooterDrop from "@/components/common/button/FooterDrop.vue";
import ColorSlider from "@/components/base/slider/ColorSlider.vue";

const { currentHue, previewHue } = useTheme();
const { t } = useLang();
</script>

<template>
  <FooterDrop
    :text="t('components.theme.ToggleColor.paletteTitle')"
    contentClass="min-w-52 p-3"
  >
    <template #icon>
      <Palette class="w-3.5 h-3.5" />
    </template>

    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <div
            class="w-1 h-3.5 rounded-sm"
            style="background-color: oklch(0.6 0.18 var(--app-hue))"
          />
          <span class="text-fg font-bold text-xs">{{
            t("components.theme.ToggleColor.paletteTitle")
          }}</span>
        </div>
        <span
          class="px-1.5 py-0.5 bg-bg-muted flex items-center justify-center text-fg-subtle rounded text-xs font-bold"
          >{{ currentHue }}</span
        >
      </div>

      <!-- 拖拽走 previewHue：跟手写入，不做补间 -->
      <ColorSlider :model-value="currentHue" @update:model-value="previewHue" />
    </div>
  </FooterDrop>
</template>
