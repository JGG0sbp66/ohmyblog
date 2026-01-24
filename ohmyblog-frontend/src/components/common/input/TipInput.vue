<script setup lang="ts">
import { ref, computed } from 'vue';
import { useVModel } from '@vueuse/core';
import { vAutoAnimate } from '@formkit/auto-animate';
import { useLang } from '@/composables/lang.hook';
import BaseTooltip from '@/components/base/pop/BaseTooltip.vue';

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
    /** 校验正则表达式 */
    pattern?: RegExp;
    /** 正则校验失败文案 */
    errorMessage?: string;
    /** 外部传入的错误信息 */
    externalError?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue', 'blur', 'validate']);

const innerValue = useVModel(props, 'modelValue', emit);

const { t } = useLang();
const internalError = ref('');

/** 最终展示出来的错误信息 */
const displayError = computed(() => internalError.value || props.externalError);

/** 校验逻辑 */
const validate = () => {
    const value = String(innerValue.value || '').trim();

    // 1. 必填校验：利用已有的 i18n
    if (props.required && !value) {
        internalError.value = t('components.common.input.TipInput.required');
        emit('validate', false);
        return false;
    }

    // 2. 正则校验
    if (props.pattern && value && !props.pattern.test(value)) {
        internalError.value = props.errorMessage || '';
        emit('validate', false);
        return false;
    }

    internalError.value = '';
    emit('validate', true);
    return true;
};

const handleBlur = () => {
    validate();
    emit('blur');
};

defineExpose({ validate });
</script>

<template>
    <div class="flex flex-col w-full text-left" v-auto-animate>

        <!-- Label 区域 -->
        <div v-if="label" class="flex items-center gap-1.5 mb-1.5 px-1">
            <label class="text-xs font-bold text-text-icon uppercase tracking-wider select-none">
                {{ label }}
                <span v-if="required" class="text-red-500 ml-0.5">*</span>
            </label>

            <!-- 提示窗组件 -->
            <BaseTooltip v-if="hint" :content="hint" />
        </div>

        <!-- Input Wrapper -->
        <div class="w-full bg-bg-secondary py-3 px-4 rounded-xl text-text-main border border-transparent transition-all flex items-center"
            :class="[
                readonly ? 'opacity-60 cursor-not-allowed' : 'focus-within:ring-2 focus-within:ring-primary/30',
                displayError ? 'ring-2 ring-red-500' : ''
            ]">
            <input :type="type || 'text'" v-model="innerValue" @blur="handleBlur" @input="internalError && validate()"
                :placeholder="placeholder" :readonly="readonly"
                class="w-full bg-transparent outline-none placeholder:text-text-icon/40 text-sm font-medium" />
        </div>

        <p v-if="displayError" class="text-[11px] text-red-500 mt-1 px-1 leading-tight">
            {{ displayError }}
        </p>
    </div>
</template>