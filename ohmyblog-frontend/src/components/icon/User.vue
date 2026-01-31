<!-- src/components/icon/User.vue -->
<script setup lang="ts">
import { User } from "lucide-vue-next";
import { RiUserLine } from "@remixicon/vue";
const props = withDefaults(
  defineProps<{
    sizeClass?: string;
  }>(),
  {
    sizeClass: "w-4 h-4",
  },
);
</script>

<template>
  <!-- <User :class="props.sizeClass" /> -->
   <RiUserLine :class="props.sizeClass" />
</template>
