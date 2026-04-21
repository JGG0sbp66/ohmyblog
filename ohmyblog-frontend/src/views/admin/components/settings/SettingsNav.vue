<script setup lang="ts">
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";

interface MenuItem {
  id: string;
  name: string;
}

defineProps<{
  menuItems: MenuItem[];
  activeTab: string;
}>();

defineEmits<{
  (e: 'update:activeTab', id: string): void;
}>();
</script>

<template>
  <nav class="flex items-center gap-2">
    <ButtonSecondary
      v-for="item in menuItems"
      :key="item.id"
      :text="item.name"
      :isActive="activeTab === item.id"
      class="h-11 px-4"
      @click="$emit('update:activeTab', item.id)"
    />
  </nav>
</template>
