<!-- src/views/admin/components/settings/ViewportSelector.vue -->
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import Monitor from "@/components/icon/ui/Monitor.vue";
import Smartphone from "@/components/icon/ui/Smartphone.vue";

defineProps<{
  modelValue: 'pc' | 'mobile'
}>();

defineEmits<{
  (e: 'update:modelValue', value: 'pc' | 'mobile'): void
}>();

const { t } = useI18n();
</script>

<template>
  <div class="bg-bg-card rounded-3xl shadow-xl p-6 flex items-center justify-between animate-fade-in animate-delay-150">
    <div class="flex flex-col">
      <span class="text-sm font-bold text-fg/80">{{ t('views.admin.Settings.appearance.viewport.title') }}</span>
      <span class="text-xs text-fg-subtle">Real-time device preview</span>
    </div>
    <div class="flex gap-2">
      <ButtonSecondary
        :isActive="modelValue === 'pc'"
        class="px-4 py-2"
        @click="$emit('update:modelValue', 'pc')"
      >
        <div class="flex items-center gap-2">
          <Monitor class="w-4 h-4" />
          <span class="text-xs font-bold">{{ t('views.admin.Settings.appearance.viewport.desktop') }}</span>
        </div>
      </ButtonSecondary>
      <ButtonSecondary
        :isActive="modelValue === 'mobile'"
        class="px-4 py-2"
        @click="$emit('update:modelValue', 'mobile')"
      >
        <div class="flex items-center gap-2">
          <Smartphone class="w-4 h-4" />
          <span class="text-xs font-bold">{{ t('views.admin.Settings.appearance.viewport.mobile') }}</span>
        </div>
      </ButtonSecondary>
    </div>
  </div>
</template>