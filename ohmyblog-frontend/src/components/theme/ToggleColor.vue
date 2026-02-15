<!-- src/components/theme/ToggleColor.vue -->
<script lang="ts" setup>
import { useTheme } from "@/composables/theme.hook";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ColorPicker from "../icon/theme/ColorPicker.vue";
import DropButton from "../common/button/DropButton.vue";
import ColorSlider from "../base/slider/ColorSlider.vue";

const { currentHue } = useTheme();
</script>

<template>
  <DropButton
    :contentClass="'flex flex-col gap-4 min-w-60 p-4'"
    placement="-left-20"
  >
    <template #trigger="{ active }">
      <ButtonSecondary :isActive="active" class="w-full h-full">
        <ColorPicker />
      </ButtonSecondary>
    </template>

    <template #content>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <!-- 动态指示条，跟随当前 hue 变化 -->
          <div
            class="w-1 h-4 rounded-sm"
            :style="{ backgroundColor: `oklch(0.60 0.18 ${currentHue})` }"
          ></div>
          <span class="text-fg font-bold text-lg">{{
            $t("components.theme.ToggleColor.paletteTitle")
          }}</span>
        </div>
        <span
          class="w-10 h-7 bg-bg-muted flex items-center justify-center text-fg-subtle rounded-lg text-sm font-bold"
          >{{ currentHue }}</span
        >
      </div>

      <div class="flex flex-col gap-2 py-2">
        <ColorSlider v-model="currentHue" />
      </div>
    </template>
  </DropButton>
</template>
