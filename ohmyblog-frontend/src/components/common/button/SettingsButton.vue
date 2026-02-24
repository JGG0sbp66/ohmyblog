<!-- src/components/common/button/SettingsButton.vue -->
<script lang="ts" setup>
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import Settings from "@/components/icon/common/Settings.vue";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();

const goToDashboard = () => {
  router.push({ name: "dashboard" });
};
</script>

<template>
  <div v-if="authStore.isAdmin" class="w-11 h-11">
    <ButtonSecondary @click="goToDashboard" class="w-full h-full">
      <Settings />
    </ButtonSecondary>
  </div>
</template>
