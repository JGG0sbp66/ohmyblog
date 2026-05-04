<!-- src/components/theme/ToggleTheme.vue -->
<script lang="ts" setup>
import { useTheme } from "@/composables/theme.hook";
import ButtonSecondary from "../base/button/ButtonSecondary.vue";
import { RiContrastLine, RiSunLine, RiMoonLine } from "@remixicon/vue";
import { computed } from "vue";
import { useLang } from "@/composables/lang.hook";
import DropButton from "../common/button/DropButton.vue";
import { type TThemeMode, THEME_MODES } from "@/api/shared";

const { t } = useLang();
const { colorMode, cycleTheme, setTheme } = useTheme();

const themeOptions = computed(() => {
  return THEME_MODES.map((mode: TThemeMode) => ({
    value: mode,
    label: t(`components.theme.ToggleTheme.${mode}`),
  }));
});

// 判断当前主题是否为选中主题
const isActive = (value: TThemeMode) => {
  return colorMode.value === value;
};
</script>

<template>
  <DropButton placement="-left-10">
    <template #trigger="{ active }">
      <!-- 点击触发循环切换 -->
      <ButtonSecondary
        :isActive="active"
        @click="cycleTheme()"
        class="w-full h-full"
      >
        <RiContrastLine v-if="colorMode === 'auto'" class="w-5 h-5" />
        <RiSunLine v-if="colorMode === 'light'" class="w-5 h-5" />
        <RiMoonLine v-if="colorMode === 'dark'" class="w-5 h-5" />
      </ButtonSecondary>
    </template>

    <template #content>
      <div class="flex flex-col gap-1">
        <ButtonSecondary
          v-for="option in themeOptions"
          :key="option.value"
          @click="setTheme(option.value)"
          :text="option.label"
          class="w-full py-2.5 px-4 justify-start"
          :isActive="isActive(option.value)"
        >
          <RiContrastLine v-if="option.value === 'auto'" class="w-5 h-5" />
          <RiSunLine v-if="option.value === 'light'" class="w-5 h-5" />
          <RiMoonLine v-if="option.value === 'dark'" class="w-5 h-5" />
        </ButtonSecondary>
      </div>
    </template>
  </DropButton>
</template>
