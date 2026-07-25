<!--
  src/views/admin/components/layout/AdminSplitLayout.vue
  后台通用主从布局：桌面端左右分栏，移动端在列表和详情之间切换。
-->
<script setup lang="ts">
import { computed } from "vue";
import { ArrowLeft } from "lucide-vue-next";
import { useIsMobile } from "@/composables/breakpoint.hook";
import { useLang } from "@/composables/lang.hook";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import BaseCard from "@/components/base/card/BaseCard.vue";

const props = withDefaults(
  defineProps<{
    /** 左侧栏宽度 Tailwind class，默认 w-100。 */
    leftWidth?: string;
    /** 是否已有选中项；移动端据此切换到详情。 */
    hasSelection?: boolean;
  }>(),
  {
    leftWidth: "w-100",
    hasSelection: false,
  },
);

const emit = defineEmits<{
  (e: "back"): void;
}>();

const isMobile = useIsMobile();
const { t } = useLang();

// 两侧始终保留挂载状态，避免切换时丢失筛选条件和列表滚动位置。
const showList = computed(() => !isMobile.value || !props.hasSelection);
const showDetail = computed(() => !isMobile.value || props.hasSelection);
</script>

<template>
  <BaseCard
    padding="none"
    class="flex flex-1 min-w-0 overflow-hidden onload-animation"
  >
    <!-- 左侧列表栏：移动端默认独占整行。 -->
    <div
      v-show="showList"
      :class="[
        isMobile ? 'w-full border-r-0' : `${leftWidth} border-r`,
        'min-w-0 border-border/40 flex flex-col bg-bg-muted/10',
        'onload-animation anim-delay-100 z-10',
      ]"
    >
      <slot name="left" />
    </div>

    <!-- 右侧详情栏：移动端选中条目后独占整行。 -->
    <div
      v-show="showDetail"
      :class="[
        'min-w-0 flex-1 flex flex-col overflow-hidden onload-animation anim-delay-150',
        isMobile ? 'w-full' : '',
      ]"
    >
      <div
        v-if="isMobile"
        class="flex shrink-0 items-center border-b border-border/40 p-2"
      >
        <ButtonSecondary
          class="h-11 px-3"
          :text="t('views.main.post.back')"
          @click="emit('back')"
        >
          <ArrowLeft class="h-4 w-4" />
        </ButtonSecondary>
      </div>

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <slot name="right" />
      </div>
    </div>
  </BaseCard>
</template>
