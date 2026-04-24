<!-- src/views/main/components/hero/editors/HeroTitleEditor.vue -->
<script setup lang="ts">
import { ref } from "vue";
import ExpandButton from "@/components/common/button/ExpandButton.vue";
import Heading from "@/components/icon/common/Heading.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import HeroTitleEditorModal from "./title/HeroTitleEditorModal.vue";

const { t } = useLang();
const systemStore = useSystemStore();

const isModalOpen = ref(false);

const openModal = () => {
  console.log("[HeroTitleEditor] current title data:", {
    heroTitle: systemStore.personalInfo.heroTitle,
    heroSubtitles: systemStore.personalInfo.heroSubtitles,
  });

  isModalOpen.value = true;
};
</script>

<template>
  <button
    type="button"
    @click="openModal"
    class="z-10"
    :aria-label="t('views.main.hero.titleEditor.triggerAriaLabel')"
  >
    <ExpandButton :text="t('views.main.hero.titleEditor.triggerText')">
      <template #icon-start>
        <Heading />
      </template>
    </ExpandButton>
  </button>

  <HeroTitleEditorModal v-model="isModalOpen" />
</template>
