<!-- src/components/theme/ToggleLanguage.vue -->
<script lang="ts" setup>
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import LanguagePicker from "../icon/theme/LanguagePicker.vue";
import { type LocaleType, useLang } from "@/composables/lang.hook";
import DropButton from "../common/button/DropButton.vue";

const { locale, setLocale, SUPPORTED_LOCALES } = useLang();

// 判断当前语言是否为选中语言
const isActive = (value: string) => {
  return locale.value === value;
};

// 切换语言
const switchLanguage = (value: LocaleType) => {
  setLocale(value);
};
</script>

<template>
  <DropButton :contentClass="'min-w-36 p-2'" placement="-left-22">
    <template #trigger="{ active }">
      <ButtonSecondary :isActive="active" class="w-full h-full">
        <LanguagePicker :language="'translate'" />
      </ButtonSecondary>
    </template>

    <template #content>
      <div class="flex flex-col gap-1">
        <ButtonSecondary
          v-for="value in SUPPORTED_LOCALES"
          :key="value.label"
          @click="switchLanguage(value.value)"
          :text="value.label"
          class="w-full py-2.5 px-4 justify-start"
          :isActive="isActive(value.value)"
        >
          <LanguagePicker :language="value.value" />
        </ButtonSecondary>
      </div>
    </template>
  </DropButton>
</template>
