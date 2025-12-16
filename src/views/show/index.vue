<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ToggleColor from '@/components/theme/ToggleColor.vue';
import ToggleTheme from '@/components/theme/ToggleTheme.vue';
import Loading from '@/components/icon/Loading.vue';
import ButtonPrimary from '@/components/base/button/ButtonPrimary.vue';

const { t, locale } = useI18n();
const isloading = ref(false);

// 使用 computed 确保切换语言时文字会自动更新
const text = computed(() => isloading.value ? t('show.loading') : t('show.nextStep'));

const testLoading = () => {
  isloading.value = true;
  // text 会自动变为 '加载中' / 'Loading...'
  setTimeout(() => {
    isloading.value = false;
    // text 会自动变回 '下一步' / 'Next Step'
  }, 2000);
};

const toggleLanguage = () => {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN';
};
</script>

<template>
  <div class="ml-10 mt-10 h-10 w-32">
    <ButtonPrimary @click="testLoading" :isLoading="isloading" :text="text">
      <Loading />
    </ButtonPrimary>
  </div>
  
  <!-- 添加语言切换按钮 -->
  <button 
    @click="toggleLanguage" 
    class="ml-10 mt-5 px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
  >
    {{ t('show.language') }}: {{ locale }}
  </button>

  <Loading class="ml-10 mt-10" :size-class="'w-10 h-10'" :colorClass="'text-primary'" />
  <ToggleTheme class="mt-10 ml-10" />
  <div class="bg-bg-card h-18 flex items-center justify-center">
    <ToggleColor />
  </div>
</template>