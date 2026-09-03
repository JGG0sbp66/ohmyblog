<!-- src/components/common/button/StepButton.vue -->
<script setup lang="ts">
import { useLang } from "@/composables/lang.hook";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";

/**
 * 「左次要 / 右主要」按钮对布局，两个按钮等宽撑满。
 * 不依赖任何 store：上一步/下一步具体做什么全由使用方通过 prev/next 事件决定
 * （setup 向导绑 stepStore.prev()，404 页绑 router.back()）。
 */
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

defineEmits(["next", "prev"]);
</script>

<template>
  <div class="pt-4 flex w-full" :class="gapClass">
    <!-- 上一步按钮 -->
    <ButtonSecondary
      :class="['flex-1 py-2', showPrev ? '' : 'opacity-0 pointer-events-none']"
      @click="$emit('prev')"
      :text="prevText || t('common.prev')"
    >
      <!-- 图标插槽透传。必须带 v-if：ButtonSecondary 靠「插槽是否渲染出非
           Comment 节点」决定要不要给图标留位，若无条件写 <slot>，未传图标时
           renderSlot 仍会产出一个空 Fragment 让它误判，文字左侧凭空多出 gap。 -->
      <slot v-if="$slots['prev-icon']" name="prev-icon" />
    </ButtonSecondary>

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
