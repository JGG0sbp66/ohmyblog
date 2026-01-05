<!-- src/views/setup/components/StepButton.vue -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ButtonSecondary from '@/components/base/button/ButtonSecondary.vue';
import ButtonPrimary from '@/components/base/button/ButtonPrimary.vue';
import { useSetupStore } from '@/stores/setup.store';

interface Props {
    nextText?: string;
    prevText?: string;
    showPrev?: boolean;
    nextDisabled?: boolean;
    loading?: boolean;
    gapClass?: string;
}

const { t } = useI18n();

const props = withDefaults(defineProps<Props>(), {
    nextText: '',
    prevText: '',
    showPrev: true,
    nextDisabled: false,
    loading: false,
    gapClass: 'gap-48'
});

const stepStore = useSetupStore();

defineEmits(['next']);
</script>

<template>
    <div class="pt-4 flex w-full" :class="gapClass">
        <!-- 上一步按钮 -->
        <ButtonSecondary :class="['flex-1 py-2', showPrev ? '' : 'opacity-0 pointer-events-none']"
            @click="stepStore.prev()" :text="prevText || t('common.prev')" />

        <!-- 下一步按钮 -->
        <ButtonPrimary class="flex-1 py-2" @click="$emit('next')" :text="nextText || t('common.next')"
            :disabled="nextDisabled" :loading="loading" />
    </div>
</template>