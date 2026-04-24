<!-- src/views/main/components/MainLayout.vue -->
<script setup lang="ts">
import Header from "@/components/common/layout/Header.vue";
import Footer from "@/components/common/layout/Footer.vue";
import HeroSection from "@/views/main/components/hero/HeroSection.vue";
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <Header />
    <HeroSection />
    <main id="content-wrapper" class="flex-1">
      <div class="onload-animation">
        <router-view />
      </div>
    </main>
    <Footer />
  </div>
</template>
