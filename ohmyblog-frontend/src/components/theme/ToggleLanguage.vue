<!-- src/components/theme/ToggleLanguage.vue -->
<script lang="ts" setup>
import { computed } from "vue";
import { RiTranslate, RiCheckLine } from "@remixicon/vue";
import type { TLanguage } from "@/api/shared";
import { useLang } from "@/composables/lang.hook";
import FooterDrop from "@/components/common/button/FooterDrop.vue";

const { locale, setLocale, SUPPORTED_LOCALES } = useLang();

// 当前语言的显示标签
const currentLabel = computed(() => {
  const current = SUPPORTED_LOCALES.find((l) => l.value === locale.value);
  return current?.label ?? "";
});

// 切换语言
const switchLanguage = (value: TLanguage) => {
  setLocale(value);
};
</script>

<template>
  <FooterDrop :text="currentLabel" contentClass="min-w-32 p-1.5">
    <template #icon>
      <RiTranslate class="w-3.5 h-3.5" />
    </template>

    <div class="flex flex-col gap-0.5">
      <button
        v-for="item in SUPPORTED_LOCALES"
        :key="item.value"
        type="button"
        class="flex items-center justify-between w-full px-3 py-2 rounded-md text-xs cursor-pointer hover:text-fg hover:bg-bg-muted transition-colors duration-150"
        :class="locale === item.value ? 'text-fg' : 'text-fg-muted'"
        @click="switchLanguage(item.value)"
      >
        <span>{{ item.label }}</span>
        <RiCheckLine
          v-if="locale === item.value"
          class="w-4 h-4 text-accent"
        />
      </button>
    </div>
  </FooterDrop>
</template>
