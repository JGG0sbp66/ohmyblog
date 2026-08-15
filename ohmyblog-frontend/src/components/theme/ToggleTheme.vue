<!-- src/components/theme/ToggleTheme.vue -->
<script lang="ts" setup>
import { computed } from "vue";
import {
  RiContrastLine,
  RiSunLine,
  RiMoonLine,
  RiEyeLine,
  RiCheckLine,
} from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import { useTheme } from "@/composables/theme.hook";
import { type TThemeMode, THEME_MODES } from "@/api/shared";
import FooterDrop from "@/components/common/button/FooterDrop.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";

const { t } = useLang();
const { colorMode, setTheme } = useTheme();

// 主题选项列表
const themeOptions = computed(() => {
  return THEME_MODES.map((mode: TThemeMode) => ({
    value: mode,
    label: t(`components.theme.ToggleTheme.${mode}`),
  }));
});

// 当前主题的显示标签
const currentLabel = computed(() => {
  const current = themeOptions.value.find((o) => o.value === colorMode.value);
  return current?.label ?? "";
});
</script>

<template>
  <FooterDrop :text="currentLabel" contentClass="min-w-32 p-1.5">
    <template #icon>
      <RiContrastLine v-if="colorMode === 'auto'" class="w-3.5 h-3.5" />
      <RiSunLine v-if="colorMode === 'light'" class="w-3.5 h-3.5" />
      <RiMoonLine v-if="colorMode === 'dark'" class="w-3.5 h-3.5" />
      <RiEyeLine v-if="colorMode === 'eyecare'" class="w-3.5 h-3.5" />
    </template>

    <div class="flex flex-col gap-0.5">
      <ButtonSecondary
        v-for="option in themeOptions"
        :key="option.value"
        class="w-full! justify-start! gap-1.5! px-3! py-2! text-xs!"
        :is-active="colorMode === option.value"
        :text="option.label"
        @click="setTheme(option.value)"
      >
        <RiContrastLine v-if="option.value === 'auto'" class="h-3.5 w-3.5" />
        <RiSunLine v-if="option.value === 'light'" class="h-3.5 w-3.5" />
        <RiMoonLine v-if="option.value === 'dark'" class="h-3.5 w-3.5" />
        <RiEyeLine v-if="option.value === 'eyecare'" class="h-3.5 w-3.5" />

        <template #suffix>
          <RiCheckLine
            v-if="colorMode === option.value"
            class="h-4 w-4 text-accent"
          />
        </template>
      </ButtonSecondary>
    </div>
  </FooterDrop>
</template>
