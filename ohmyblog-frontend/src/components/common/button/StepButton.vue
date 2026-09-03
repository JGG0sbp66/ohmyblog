<!-- src/components/common/button/StepButton.vue -->
<script setup lang="ts">
import { useLang } from "@/composables/lang.hook";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import { useSetupStore } from "@/stores/setup.store";

interface Props {
  nextText?: string;
  prevText?: string;
  showPrev?: boolean;
  nextDisabled?: boolean;
  loading?: boolean;
  gapClass?: string;
}

const { t } = useLang();

const props = withDefaults(defineProps<Props>(), {
  nextText: "",
  prevText: "",
  showPrev: true,
  nextDisabled: false,
  loading: false,
  // 分档响应式间距：gap-48 是固定 rem 值（12rem），窄屏下 html 基准缩到 14px
  // 仍有 168px，会吃光手机视口的可用宽度，把两个按钮压成方块。
  gapClass: "gap-4 sm:gap-12 xl:gap-48",
});

const stepStore = useSetupStore();

defineEmits(["next"]);
</script>

<template>
  <div class="pt-4 flex w-full" :class="gapClass">
    <!-- 上一步按钮 -->
    <ButtonSecondary
      :class="['flex-1 py-2', showPrev ? '' : 'opacity-0 pointer-events-none']"
      @click="stepStore.prev()"
      :text="prevText || t('common.prev')"
    />

    <!-- 下一步按钮 -->
    <ButtonPrimary
      class="flex-1 py-2"
      @click="$emit('next')"
      :text="nextText || t('common.next')"
      :disabled="nextDisabled"
      :loading="loading"
    />
  </div>
</template>
