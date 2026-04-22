<!-- src/views/main/components/MainLayout.vue -->
<script setup lang="ts">
import Header from "@/components/common/layout/Header.vue";
import Footer from "@/components/common/layout/Footer.vue";
import HeroSection from "@/views/main/components/HeroSection.vue";
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <Header />
    <HeroSection />
    <main class="flex-1">
      <router-view />
    </main>
    <Footer />
  </div>
</template>
