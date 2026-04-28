<!-- src/views/admin/components/settings/sections/admin/AdminSection.vue -->
<script setup lang="ts">
import ProfileCard from "@/components/common/item/ProfileCard.vue";
import AccountSecurityCard from "./AccountSecurityCard.vue";
import AdminProfileCard from "./AdminProfileCard.vue";
</script>

<template>
  <!-- 
    Viewport 扩展方案：通过负 Margin 和 Padding 扩展裁剪区域，保护卡片阴影。
  -->
  <div class="-mx-6 px-6 -mb-6 pb-6 onload-animation">
    <div class="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
      <!-- 左侧：编辑表单区域 -->
      <div class="flex-1 w-full max-w-6xl flex flex-col gap-8">
        <AccountSecurityCard />
        <AdminProfileCard />
      </div>

      <!-- 右侧：预览区 (固定宽度，sticky 吸附) -->
      <aside class="hidden lg:block w-70 sticky top-0">
        <ProfileCard />
      </aside>
    </div>
  </div>
</template>
