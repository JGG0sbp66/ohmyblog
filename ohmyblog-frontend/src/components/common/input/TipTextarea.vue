<!-- src/components/common/input/TipTextarea.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import type { TSchema } from "@sinclair/typebox";
import { useVModel } from "@vueuse/core";
import { useValidator } from "@/composables/validator.hook";
import BaseInputWrapper from "@/components/base/input/BaseInputWrapper.vue";
import FieldLabel from "@/components/base/input/FieldLabel.vue";

interface Props {
  modelValue?: string | null;
  label?: string;
  placeholder?: string;
  readonly?: boolean;
  hint?: string;
  required?: boolean;
  externalError?: string;
  /**
   * 字段级 schema（一般与后端 DTO 共用）
   * - 用于校验
   * - 用于推导 maxLength（从而展示字数计数器）
   */
  schema?: TSchema;
  rows?: number;
  /** 是否展示字数计数器（默认开启；需要 schema.maxLength 才会显示） */
  showCounter?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 4,
  showCounter: true,
});
const emit = defineEmits(["update:modelValue", "blur", "validate"]);

const innerValue = useVModel(props, "modelValue", emit);

const { validate: runValidator } = useValidator();
const internalError = ref("");

const displayError = computed(() => internalError.value || props.externalError);

/**
 * 从 schema 中提取 maxLength；无 schema / 无 maxLength 时，不显示计数器
 * TypeBox schema 在 TS 类型层面并不保证 maxLength 存在，因此这里做一次运行时兜底。
 */
const maxLength = computed(() => {
  const len = (props.schema as any)?.maxLength;
  return typeof len === "number" ? len : undefined;
});

const remaining = computed(() => {
  const max = maxLength.value;
  if (!max) return undefined;
  return max - (innerValue.value?.length ?? 0);
});

const validate = () => {
  // 与 TipInput 同一套校验：required + schema（并同步错误状态到 BaseInputWrapper）
  const { isValid, error } = runValidator(innerValue.value, {
    required: props.required,
    schema: props.schema,
  });

  internalError.value = error;
  emit("validate", isValid);
  return isValid;
};

const handleBlur = () => {
  validate();
  emit("blur");
};

defineExpose({ validate });
</script>

<template>
  <div class="flex flex-col w-full text-left">
    <FieldLabel
      v-if="label"
      :label="label"
      :tooltip="hint"
      :required="required"
      class="mb-2 px-1"
    />

    <BaseInputWrapper :error="displayError" :disabled="readonly">
      <textarea
        v-model="innerValue"
        :rows="rows"
        @blur="handleBlur"
        @input="internalError && validate()"
        :placeholder="placeholder"
        :readonly="readonly"
        class="w-full min-h-10 bg-transparent px-4 py-2.5 outline-none placeholder:text-fg-soft text-sm font-medium resize-none leading-relaxed"
      />
    </BaseInputWrapper>

    <p
      v-if="showCounter && maxLength"
      class="mt-1 text-right text-[10px]"
      :class="displayError ? 'text-red-500' : 'text-fg-subtle/50'"
    >
      {{ remaining }} / {{ maxLength }}
    </p>
  </div>
</template>
