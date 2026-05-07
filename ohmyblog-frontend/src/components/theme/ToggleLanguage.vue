<!-- src/components/theme/ToggleLanguage.vue -->
<script lang="ts" setup>
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { RiTranslate, RiEmphasisCn, RiEnglishInput } from "@remixicon/vue";
import type { TLanguage } from "@/api/shared";
import { useLang } from "@/composables/lang.hook";
import DropButton from "../common/button/DropButton.vue";

const { locale, setLocale, SUPPORTED_LOCALES } = useLang();

// 判断当前语言是否为选中语言
const isActive = (value: TLanguage) => {
  return locale.value === value;
};

// 切换语言
const switchLanguage = (value: TLanguage) => {
  setLocale(value);
};
</script>

<template>
  <DropButton :contentClass="'min-w-36 p-2'" placement="-left-22">
    <template #trigger="{ active }">
      <ButtonSecondary :isActive="active" class="w-full h-full">
        <RiTranslate class="w-5 h-5" />
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
          <RiEmphasisCn v-if="value.value === 'zh-CN'" class="w-5 h-5" />
          <RiEnglishInput v-if="value.value === 'en-US'" class="w-5 h-5" />
        </ButtonSecondary>
      </div>
    </template>
  </DropButton>
</template>
