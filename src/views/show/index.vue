<script lang="ts" setup>
import { ref, computed } from 'vue';
import ToggleColor from '@/components/theme/ToggleColor.vue';
import ToggleTheme from '@/components/theme/ToggleTheme.vue';
import Loading from '@/components/icon/Loading.vue';
import ButtonPrimary from '@/components/base/button/ButtonPrimary.vue';
import ToggleLanguage from '@/components/theme/ToggleLanguage.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n(); 
const isloading = ref(false);

// 使用 computed 确保切换语言时文字会自动更新
const text = computed(() => 
  isloading.value ? t('test.text2') : t('test.text')
);
const testLoading = () => {
  isloading.value = true;
  // text 会自动变为 '加载中' / 'Loading...'
  setTimeout(() => {
    isloading.value = false;
    // text 会自动变回 '下一步' / 'Next Step'
  }, 2000);
};
</script>

<template>
  <div class="ml-10 mt-10 h-10 w-32">
    <ButtonPrimary @click="testLoading" :isLoading="isloading" :text="text">
      <Loading />
    </ButtonPrimary>
  </div>
  
  <div class="bg-bg-card h-18 flex items-center justify-center">
    <ToggleColor />
    <ToggleTheme />
    <ToggleLanguage />
  </div>
</template>