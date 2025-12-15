<script lang="ts" setup>
import { ref } from 'vue';
import ToggleColor from '@/components/theme/ToggleColor.vue';
import ToggleTheme from '@/components/theme/ToggleTheme.vue';
import Loading from '@/components/icon/Loading.vue';
import ButtonPrimary from '@/components/base/button/ButtonPrimary.vue';
import ButtonSecondary from '@/components/base/button/ButtonSecondary.vue';
import ColorPicker from '@/components/icon/ColorPicker.vue';
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
    <div class="ml-10 mt-10 h-10 w-32"><ButtonPrimary @click="testLoading" :isLoading="isloading" :text="text"><Loading /></ButtonPrimary></div>
    <Loading class="ml-10 mt-10" :size-class="'w-10 h-10'" :colorClass="'text-primary'"/>
    <ToggleColor />
    <ToggleTheme class="mt-10 ml-10"/>
    <div class="bg-bg-card h-18 flex items-center justify-center">
      <div class="w-11 h-11">
      <ButtonSecondary :hasSlot="true"><ColorPicker /></ButtonSecondary>
    </div>
    </div>
</template>