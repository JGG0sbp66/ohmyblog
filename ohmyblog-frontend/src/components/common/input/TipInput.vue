<!-- src/components/common/input/TipInput.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import type { TSchema } from "@sinclair/typebox";
import { useVModel } from "@vueuse/core";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useValidator } from "@/composables/validator.hook";
import BaseTooltip from "@/components/base/pop/BaseTooltip.vue";

interface Props {
  /** 输入框的绑定值 */
  modelValue: string | number;
  /** 输入框上方的标题文字 */
  label?: string;
  /** 输入框未输入时的占位提示 */
  placeholder?: string;
  /** 输入框类型 */
  type?: string;
  /** 是否为只读状态 */
  readonly?: boolean;
  /** Tooltip 提示文字 */
  hint?: string;
  /** 是否为必填项 */
  required?: boolean;
  /** 外部传入的错误信息 */
  externalError?: string;
  /** 可选：字段级 schema（与后端 DTO 共用） */
  schema?: TSchema;
}

const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue", "blur", "validate"]);

const innerValue = useVModel(props, "modelValue", emit);

/** 初始化校验 Hook */
const { validate: runValidator } = useValidator();
/** 内部校验产生的错误信息（由 runValidator 返回） */
const internalError = ref("");

/**
 * 最终展示出来的错误信息
 * 优先级：内部校验错误 > 外部传入错误 (props.externalError)
 */
const displayError = computed(() => internalError.value || props.externalError);

/**
 * 执行组件校验
 * 结合 Props 中的必填项和 Schema 进行验证，并同步 internalError 状态
 * @returns {boolean} 校验是否通过
 */
const validate = () => {
  const { isValid, error } = runValidator(innerValue.value, {
    required: props.required,
    schema: props.schema,
  });

  internalError.value = error;
  emit("validate", isValid);
  return isValid;
};

/** 失去焦点时触发校验 */
const handleBlur = () => {
  validate();
  emit("blur");
};

/** 暴露接口给父组件，支持外部手动触发校验 */
defineExpose({ validate });
</script>

<template>
  <div class="flex flex-col w-full text-left" v-auto-animate>
    <!-- Label 区域 -->
    <div v-if="label" class="flex items-center gap-1.5 mb-1.5 px-1">
      <label
        class="text-xs font-bold text-fg-subtle uppercase tracking-wider select-none"
      >
        {{ label }}
        <span v-if="required" class="text-red-500 ml-0.5">*</span>
      </label>

      <!-- 提示窗组件 -->
      <BaseTooltip v-if="hint" :content="hint" />
    </div>

    <!-- Input Wrapper -->
    <div
      class="w-full bg-bg-muted py-3 px-4 rounded-xl text-fg border border-transparent transition-all flex items-center"
      :class="[
        readonly
          ? 'opacity-60 cursor-not-allowed'
          : 'focus-within:ring-2 focus-within:ring-accent/30',
        displayError ? 'ring-2 ring-red-500' : '',
      ]"
    >
      <input
        :type="type || 'text'"
        v-model="innerValue"
        @blur="handleBlur"
        @input="internalError && validate()"
        :placeholder="placeholder"
        :readonly="readonly"
        class="w-full bg-transparent outline-none placeholder:text-fg-soft text-sm font-medium"
      />
    </div>

    <p
      v-if="displayError"
      class="text-[11px] text-red-500 mt-1 px-1 leading-tight"
    >
      {{ displayError }}
    </p>
  </div>
</template>
