<!-- src/views/admin/components/settings/sections/admin/AdminSection.vue -->
<script setup lang="ts">
import ProfileCard from "@/components/common/item/ProfileCard.vue";
import AccountSecurityCard from "./AccountSecurityCard.vue";
import AdminProfileCard from "./AdminProfileCard.vue";
</script>

<template>
  <div class="w-full max-w-7xl mx-auto onload-animation">
    <div class="flex flex-col lg:flex-row justify-center gap-8 items-start">
      <!-- 左侧：编辑表单  -->
      <div class="flex-1 w-full max-w-6xl flex flex-col gap-6">
        <AccountSecurityCard />
        <AdminProfileCard />
      </div>

      <!-- 右侧：预览区 (固定宽度) -->
      <aside class="hidden lg:block w-70 sticky top-0">
        <ProfileCard />
      </aside>
    </div>
  </div>
</template>
