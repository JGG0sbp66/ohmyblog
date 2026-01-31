<!-- src/components/base/upload/ImageUpload.vue -->
<script setup lang="ts">
import { ref } from "vue";
import Picture from "@/components/icon/Picture.vue";
import Loading from "@/components/icon/Loading.vue";

/**
 * 通用图片上传预览组件
 */
interface Props {
  /** 图片预览 URL */
  modelValue?: string | null;
  /** 是否处于上传中状态 */
  loading?: boolean;
  /** 宽度类名 (Tailwind) */
  width?: string;
  /** 高度类名 (Tailwind) */
  height?: string;
  /** 允许的文件类型 */
  accept?: string;
  /** 圆角类名 */
  roundedClass?: string;
  /** 未上传图片时显示的说明文字 */
  description?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  loading: false,
  width: "w-20",
  height: "h-20",
  accept: "image/*",
  roundedClass: "rounded-xl",
});

const emit = defineEmits<{
  /** 文件选择变更时触发 */
  (e: "change", file: File): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

/**
 * 触发文件选择器
 */
const handleClick = () => {
  if (props.loading) return;
  fileInputRef.value?.click();
};

/**
 * 处理文件选择
 */
const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  emit("change", file);
  // 清空 input 允许重复上传同一文件
  if (fileInputRef.value) fileInputRef.value.value = "";
};

// 暴露 API 给父组件
defineExpose({
  triggerClick: handleClick,
});
</script>

<template>
  <div :class="['relative', width]">
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      class="hidden"
      @change="handleFileChange"
    />

    <div
      :class="[
        width,
        height,
        roundedClass,
        'border-2 border-dashed border-border-subtle flex items-center justify-center bg-bg-secondary overflow-hidden relative group transition-colors',
        loading
          ? 'cursor-not-allowed'
          : 'cursor-pointer hover:border-primary/50',
      ]"
      @click="handleClick"
    >
      <!-- 图片预览 -->
      <img
        v-if="modelValue"
        :src="modelValue"
        alt="Preview"
        class="w-full h-full object-cover"
        :class="{ 'opacity-50': loading }"
      />

      <!-- 默认内容 (图标 + 说明文字) -->
      <div v-else class="flex flex-col items-center gap-2 p-2">
        <slot name="icon">
          <Picture size-class="w-8 h-8 text-text-icon opacity-40" />
        </slot>
        <p
          v-if="description"
          class="text-[10px] text-text-icon opacity-60 text-center leading-tight"
        >
          {{ description }}
        </p>
      </div>

      <!-- 悬浮遮罩 (仅在有图片且非加载时显示) -->
      <div
        v-if="!loading && modelValue"
        class="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Picture size-class="w-6 h-6 text-white drop-shadow-sm" />
      </div>

      <!-- 加载中遮罩 -->
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-bg-card/60"
      >
        <Loading size-class="w-6 h-6 text-primary" />
      </div>
    </div>
  </div>
</template>
