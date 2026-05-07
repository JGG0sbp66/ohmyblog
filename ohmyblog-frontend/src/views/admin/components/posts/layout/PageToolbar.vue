<!-- src/views/admin/components/posts/layout/PageToolbar.vue -->
<script setup lang="ts"></script>

<template>
  <div
    class="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40"
  >
    <slot name="left" />
    <slot name="right" />
  </div>
</template>
