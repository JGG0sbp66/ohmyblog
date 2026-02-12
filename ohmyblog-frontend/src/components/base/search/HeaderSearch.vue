<script lang="ts" setup>
import Search from "@/components/icon/Search.vue";
import ButtonSecondary from "../button/ButtonSecondary.vue";
</script>

<template>
  <div class="w-11 h-11">
    <!-- TODO: 后续再新增鼠标悬浮展开搜索框功能 -->
    <ButtonSecondary :has-slot="true">
      <Search class="w-4 h-4 text-fg-subtle group-focus-within:text-accent" />
    </ButtonSecondary>
  </div>
</template>
