<!-- src/components/theme/ToggleTheme.vue -->
<script lang="ts" setup>
import { computed } from "vue";
import { RiContrastLine, RiSunLine, RiMoonLine, RiCheckLine } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import { useTheme } from "@/composables/theme.hook";
import { type TThemeMode, THEME_MODES } from "@/api/shared";
import FooterDrop from "@/components/common/button/FooterDrop.vue";

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
    </template>

    <div class="flex flex-col gap-0.5">
      <button
        v-for="option in themeOptions"
        :key="option.value"
        type="button"
        class="flex items-center justify-between w-full px-3 py-2 rounded-md text-xs cursor-pointer hover:text-fg hover:bg-bg-muted transition-colors duration-150"
        :class="colorMode === option.value ? 'text-fg' : 'text-fg-muted'"
        @click="setTheme(option.value)"
      >
        <span class="flex items-center gap-1.5">
          <RiContrastLine v-if="option.value === 'auto'" class="w-3.5 h-3.5" />
          <RiSunLine v-if="option.value === 'light'" class="w-3.5 h-3.5" />
          <RiMoonLine v-if="option.value === 'dark'" class="w-3.5 h-3.5" />
          {{ option.label }}
        </span>
        <RiCheckLine
          v-if="colorMode === option.value"
          class="w-4 h-4 text-accent"
        />
      </button>
    </div>
  </FooterDrop>
</template>
