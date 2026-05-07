<!-- src/components/common/input/SearchInput.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useVModel } from "@vueuse/core";
import { RiSearchLine, RiCloseLine } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";

interface Props {
  modelValue: string;
  /** 自定义占位文字，不传则使用 i18n 默认值 */
  placeholder?: string;
  /** 输入框宽度，默认 w-56 */
  width?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: undefined,
  width: "w-56",
});

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  /** 按下 Enter 或点击搜索图标时触发 */
  (e: "search", v: string): void;
}>();

const { t } = useLang();

const innerValue = useVModel(props, "modelValue", emit);

const resolvedPlaceholder = computed(
  () =>
    props.placeholder ?? t("components.common.input.SearchInput.placeholder"),
);

const handleClear = () => {
  innerValue.value = "";
  emit("search", "");
};

const handleEnter = () => {
  emit("search", innerValue.value);
};
</script>

<template>
  <div
    class="flex items-center gap-2 h-10 px-3 rounded-xl bg-bg-muted border border-transparent transition-all duration-150 focus-within:ring-2 focus-within:ring-accent/30"
    :class="width"
  >
    <!-- 搜索图标 -->
    <RiSearchLine
      class="w-4 h-4 text-fg-soft shrink-0 transition-colors duration-150 group-focus-within:text-accent"
    />

    <!-- 输入框 -->
    <input
      v-model="innerValue"
      :placeholder="resolvedPlaceholder"
      class="flex-1 min-w-0 bg-transparent outline-none text-sm text-fg placeholder:text-fg-soft"
      @keydown.enter="handleEnter"
    />

    <!-- 清空按钮：有内容时渐显 -->
    <button
      v-if="innerValue"
      type="button"
      class="shrink-0 text-fg-soft hover:text-fg-subtle transition-colors duration-150 cursor-pointer"
      @click="handleClear"
    >
      <RiCloseLine class="w-4 h-4" />
    </button>
  </div>
</template>
