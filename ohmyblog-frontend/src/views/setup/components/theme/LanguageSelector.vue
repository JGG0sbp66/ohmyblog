<!-- src/components/theme/LanguageSelector.vue -->
<script setup lang="ts">
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import LanguagePicker from "@/components/icon/theme/LanguagePicker.vue";
import { useLang } from "@/composables/lang.hook";

const { locale, setLocale, SUPPORTED_LOCALES } = useLang();
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <ButtonSecondary
      v-for="lang in SUPPORTED_LOCALES"
      :key="lang.value"
      :isActive="locale === lang.value"
      class="w-full justify-center py-3"
      @click="setLocale(lang.value)"
    >
      <div class="flex items-center gap-2">
        <LanguagePicker :language="lang.value" />
        <span>{{ lang.label }}</span>
      </div>
    </ButtonSecondary>
  </div>
</template>
