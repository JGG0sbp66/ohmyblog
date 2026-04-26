<!-- 
  src/views/main/components/hero/editors/title/HeroMainTitleEditor.vue 
  主标题编辑器，直接同步数据至 SystemStore。
-->
<script setup lang="ts">
import TipInput from "@/components/common/input/TipInput.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";

const { t } = useLang();

// 获取全局配置状态，主标题直接绑定到 store，输入即改内存态配置。
const systemStore = useSystemStore();
</script>

<template>
  <TipInput
    v-model="systemStore.personalInfo.heroTitle"
    :label="t('views.main.hero.titleEditor.mainTitle')"
    :placeholder="t('views.main.hero.titleEditor.placeholder')"
  />
</template>
