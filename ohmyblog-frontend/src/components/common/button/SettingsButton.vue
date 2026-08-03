<!-- src/components/common/button/SettingsButton.vue -->
<script lang="ts" setup>
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { RiSettings3Line, RiUserSharedLine } from "@remixicon/vue";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();

const goToDashboard = () => {
  router.push({ name: "dashboard" });
};

const goToLogin = () => {
  router.push({ name: "login" });
};
</script>

<template>
  <div class="w-11 h-11">
    <ButtonSecondary v-if="authStore.isAdmin" @click="goToDashboard" class="w-full h-full">
      <RiSettings3Line class="w-5 h-5" />
    </ButtonSecondary>
    <ButtonSecondary v-else @click="goToLogin" class="w-full h-full">
      <RiUserSharedLine class="w-5 h-5" />
    </ButtonSecondary>
  </div>
</template>
