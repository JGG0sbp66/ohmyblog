<!-- src/components/theme/ToggleTheme.vue -->
<script lang="ts" setup>
import { useTheme } from "@/composables/theme.hook";
import ButtonSecondary from "../base/button/ButtonSecondary.vue";
import ThemePicker from "../icon/theme/ThemePicker.vue";
import { computed } from "vue";
import { useLang } from "@/composables/lang.hook";
import DropButton from "../common/button/DropButton.vue";

const { t } = useLang();
const { colorMode, cycleTheme, setTheme, THEME_MODES } = useTheme();

const themeOptions = computed(() => {
  return THEME_MODES.map((mode) => ({
    value: mode,
    label: t(`components.theme.ToggleTheme.${mode}`),
  }));
});

// 判断当前主题是否为选中主题
const isActive = (value: string) => {
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
        <!-- 传入当前的模式名称 -->
        <ThemePicker :theme="colorMode" />
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
          <ThemePicker :theme="option.value" />
        </ButtonSecondary>
      </div>
    </template>
  </DropButton>
</template>
