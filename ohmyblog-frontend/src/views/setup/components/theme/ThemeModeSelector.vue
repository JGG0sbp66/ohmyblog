<!-- src/components/theme/ThemeModeSelector.vue -->
<script setup lang="ts">
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ThemePicker from "@/components/icon/theme/ThemePicker.vue";
import { useTheme } from "@/composables/theme.hook";
import { useLang } from "@/composables/lang.hook";
import { THEME_MODES } from "@/api/shared";

const { t } = useLang();
const { colorMode, setTheme } = useTheme();
</script>

<template>
  <div class="grid grid-cols-3 gap-3">
    <ButtonSecondary
      v-for="mode in THEME_MODES"
      :key="mode"
      :isActive="colorMode === mode"
      class="w-full justify-center py-3"
      @click="setTheme(mode)"
    >
      <div class="flex items-center gap-2">
        <ThemePicker :theme="mode" />
        <span class="capitalize">{{
          t(`components.theme.ToggleTheme.${mode}`)
        }}</span>
      </div>
    </ButtonSecondary>
  </div>
</template>
