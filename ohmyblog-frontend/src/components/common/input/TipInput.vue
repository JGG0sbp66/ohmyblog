<!-- src/components/common/input/TipInput.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import type { TSchema } from "@sinclair/typebox";
import { useVModel } from "@vueuse/core";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/vue";
import { useValidator } from "@/composables/validator.hook";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";
import BaseInputWrapper from "@/components/base/input/BaseInputWrapper.vue";
import FieldLabel from "@/components/base/input/FieldLabel.vue";

interface Props {
  /** 输入框的绑定值 */
  modelValue?: string | number | null;
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
  /** HTML autocomplete 属性，用于密码管理器识别字段类型 */
  autocomplete?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue", "blur", "validate"]);

const innerValue = useVModel(props, "modelValue", emit);

const { t } = useLang();

/** input 元素引用，用于 readonly 模式下全选文本 */
const inputRef = ref<HTMLInputElement>();

/**
 * 密码明文可见状态。仅 type=password 且非只读时生效；
 * 浏览器自带的密码眼睛已在 css/base.css 里压掉（::-ms-reveal 等），
 * 显隐统一由这里的按钮负责，避免出现两个眼睛。
 */
const passwordVisible = ref(false);

/** 是否为可切换显隐的密码框（只读密码框走点击复制逻辑，不给切换按钮） */
const isPasswordField = computed(
  () => props.type === "password" && !props.readonly,
);

/** 实际渲染的 input 类型：密码框在 password / text 间切换 */
const effectiveType = computed(() => {
  if (isPasswordField.value) return passwordVisible.value ? "text" : "password";
  return props.type || "text";
});

/**
 * 切换密码显隐。
 * mousedown.prevent：点击按钮不应把焦点从输入框抢走，
 * 否则正在输入的用户会被打断（blur 触发校验、光标丢失）。
 */
const togglePasswordVisible = () => {
  passwordVisible.value = !passwordVisible.value;
};

/**
 * readonly 模式下点击输入框：全选文本并复制到剪贴板
 */
const handleReadonlyCopy = async () => {
  if (!props.readonly || !inputRef.value) return;

  // 全选文本
  inputRef.value.select();

  // 复制到剪贴板
  const text = String(innerValue.value ?? "");
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    useToast.success(t("common.copied"));
  } catch {
    useToast.error(t("common.copyFailed"));
  }
};

/** 初始化校验 Hook */
const { validate: runValidator } = useValidator();
/** 内部校验产生的错误信息（由 runValidator 返回） */
const internalError = ref("");
/** 用户是否交互过此输入框（是否已产生 input 事件） */
const touched = ref(false);

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

/**
 * 失去焦点时触发校验
 * 只校验交互过的字段：密码管理器（如 Bitwarden）自动填充时的 blur 早于值同步，
 * 无条件校验会闪出一次「不能为空」的误报。未交互字段仍由提交时的 validate() 兜底。
 */
const handleBlur = () => {
  if (touched.value) validate();
  emit("blur");
};

/** 输入时标记为已交互，并在已有错误的情况下即时重新校验 */
const handleInput = () => {
  touched.value = true;
  if (internalError.value) validate();
};

/** 暴露接口给父组件，支持外部手动触发校验 */
defineExpose({ validate });
</script>

<template>
  <div class="flex flex-col w-full text-left">
    <!-- Label 区域：仅在传入时渲染 -->
    <FieldLabel
      v-if="label"
      :label="label"
      :tooltip="hint"
      :required="required"
      class="mb-2 px-1"
    />

    <!-- Input Wrapper：固定的最小高度，确保与旁边按钮对齐 -->
    <BaseInputWrapper :error="displayError" :disabled="readonly">
      <input
        ref="inputRef"
        :type="effectiveType"
        v-model="innerValue"
        @blur="handleBlur"
        @input="handleInput"
        @click="handleReadonlyCopy"
        :placeholder="placeholder"
        :readonly="readonly"
        :autocomplete="autocomplete"
        class="w-full min-h-10 bg-transparent px-4 outline-none placeholder:text-fg-soft text-sm font-medium py-2.5"
        :class="[
          readonly ? 'cursor-pointer select-all' : '',
          isPasswordField ? 'pr-2' : '',
        ]"
      />

      <!-- 密码显隐切换：图标语义与浏览器习惯一致 ——
           密文态显示睁眼（点了可看），明文态显示划线眼（点了隐藏） -->
      <template v-if="isPasswordField" #suffix>
        <button
          type="button"
          class="shrink-0 mr-3 p-1 text-fg-soft hover:text-fg-subtle transition-colors duration-150 cursor-pointer"
          :title="
            t(
              passwordVisible
                ? 'components.common.input.TipInput.hidePassword'
                : 'components.common.input.TipInput.showPassword',
            )
          "
          :aria-label="
            t(
              passwordVisible
                ? 'components.common.input.TipInput.hidePassword'
                : 'components.common.input.TipInput.showPassword',
            )
          "
          @mousedown.prevent
          @click="togglePasswordVisible"
        >
          <RiEyeOffLine v-if="passwordVisible" class="w-4 h-4" />
          <RiEyeLine v-else class="w-4 h-4" />
        </button>
      </template>
    </BaseInputWrapper>
  </div>
</template>
