<script lang="ts" setup>
import { ref } from 'vue';
import ToggleColor from '@/components/theme/ToggleColor.vue';
import ToggleTheme from '@/components/theme/ToggleTheme.vue';
import Loading from '@/components/base/Loading.vue';
import ButtonPrimary from '@/components/base/button/ButtonPrimary.vue';

const isloading = ref(false);
const text = ref('下一步');

const testLoading = () => {
  isloading.value = true;
  text.value = '加载中';
  setTimeout(() => {
    isloading.value = false;
    text.value = '下一步';
  }, 2000);
};
</script>

<template>
    <div class="ml-10 mt-10 h-10 w-32"><ButtonPrimary @click="testLoading" :isloading="isloading" :text="text"><Loading :colorClass="'text-white'" /></ButtonPrimary></div>
    <Loading class="ml-10 mt-10" :size-class="'w-10 h-10'"/>
    <ToggleColor />
    <ToggleTheme class="mt-10 ml-10"/>
</template>