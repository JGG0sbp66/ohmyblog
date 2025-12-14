<script lang="ts" setup>
import ToggleColor from '@/components/base/toggleColor.vue';
import Loading from '@/components/base/loading.vue';
import Button from '@/components/button/button.vue';
</script>

<template>
    <div class="ml-10 mt-10 h-10 w-32"><Button :isloading="true"><Loading :colorClass="'text-white'" /></Button></div>
    <Loading class="ml-10 mt-10" :size-class="'w-10 h-10'"/>
    <ToggleColor />
</template>