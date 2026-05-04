<!-- src/components/theme/ThemeModeSelector.vue -->
<script setup lang="ts">
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { RiContrastLine, RiSunLine, RiMoonLine } from "@remixicon/vue";
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
        <RiContrastLine v-if="mode === 'auto'" class="w-5 h-5" />
        <RiSunLine v-if="mode === 'light'" class="w-5 h-5" />
        <RiMoonLine v-if="mode === 'dark'" class="w-5 h-5" />
        <span class="capitalize">{{
          t(`components.theme.ToggleTheme.${mode}`)
        }}</span>
      </div>
    </ButtonSecondary>
  </div>
</template>
