<!-- src/components/common/button/SettingsButton.vue -->
<script lang="ts" setup>
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import Settings from "@/components/icon/common/Settings.vue";
import { useRouter } from "vue-router";

const router = useRouter();

const goToDashboard = () => {
  router.push({ name: "dashboard" });
};

// TODO: 添加用户角色判断逻辑
// 1. 创建 stores/auth.store.ts 用于管理用户登录状态和角色信息
// 2. 在登录成功后将用户信息（包括 role）存储到 auth store
// 3. 在此组件中引入 auth store，读取 isAdmin 状态
// 4. 使用 v-if="authStore.isAdmin" 控制按钮显示
// 5. 考虑添加 token 持久化和页面刷新后的用户信息恢复机制
</script>

<template>
  <!-- TODO: 添加 v-if 条件，仅当用户为管理员时显示 -->
  <div class="w-11 h-11">
    <ButtonSecondary @click="goToDashboard" class="w-full h-full">
      <Settings />
    </ButtonSecondary>
  </div>
</template>
