<!-- src/components/common/smtp/SMTPForm.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import AdvancedToggle from "@/components/icon/ui/AdvancedToggle.vue";
import SMTPTestButton from "./SMTPTestButton.vue";
import { useLang } from "@/composables/lang.hook";
import { type Validatable } from "@/composables/setup-step.hook";
import { SMTPConfigUpsertDTO } from "@server/dtos/config.dto";
import { useAutoAnimate } from "@formkit/auto-animate/vue";

const props = withDefaults(
  defineProps<{
    modelValue: {
      host: string;
      port: number;
      username: string;
      password: string;
      senderEmail?: string;
      senderName?: string;
    };
    isAdvancedExpanded?: boolean;
  }>(),
  {
    isAdvancedExpanded: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: any): void;
  (e: "update:isAdvancedExpanded", value: boolean): void;
  (e: "registerValidator", validator: (() => boolean) | null): void;
}>();

const { t } = useLang();
const [advancedContentRef] = useAutoAnimate();
const [testButtonContainerRef] = useAutoAnimate();

const hostRef = ref<Validatable | null>(null);
const portRef = ref<Validatable | null>(null);
const usernameRef = ref<Validatable | null>(null);
const passwordRef = ref<Validatable | null>(null);
const senderEmailRef = ref<Validatable | null>(null);
const senderNameRef = ref<Validatable | null>(null);

const validate = () => {
  const baseFieldValid = [
    hostRef.value?.validate?.() ?? false,
    portRef.value?.validate?.() ?? false,
    usernameRef.value?.validate?.() ?? false,
    passwordRef.value?.validate?.() ?? false,
  ].every((res) => res === true);

  const senderEmailValid = props.isAdvancedExpanded
    ? (senderEmailRef.value?.validate?.() ?? true)
    : true;
  const senderNameValid = props.isAdvancedExpanded
    ? (senderNameRef.value?.validate?.() ?? true)
    : true;

  return baseFieldValid && senderEmailValid && senderNameValid;
};

onMounted(() => {
  emit("registerValidator", validate);
});

onBeforeUnmount(() => {
  emit("registerValidator", null);
});

defineExpose({ validate });

/** 统一处理字段更新 */
const updateField = (key: string, value: any) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value,
  });
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div ref="testButtonContainerRef">
      <SMTPTestButton :config="modelValue" />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <TipInput
        ref="hostRef"
        :model-value="modelValue.host"
        :label="t('views.setup.steps.step5.form.host.label')"
        :placeholder="t('views.setup.steps.step5.form.host.placeholder')"
        :schema="SMTPConfigUpsertDTO.properties.configValue.properties.host"
        required
        @update:model-value="updateField('host', $event)"
      />

      <TipInput
        ref="portRef"
        :model-value="modelValue.port"
        type="number"
        :label="t('views.setup.steps.step5.form.port.label')"
        :placeholder="t('views.setup.steps.step5.form.port.placeholder')"
        :schema="SMTPConfigUpsertDTO.properties.configValue.properties.port"
        required
        @update:model-value="updateField('port', Number($event))"
      />
    </div>

    <TipInput
      ref="usernameRef"
      :model-value="modelValue.username"
      :label="t('views.setup.steps.step5.form.username.label')"
      :placeholder="t('views.setup.steps.step5.form.username.placeholder')"
      :schema="SMTPConfigUpsertDTO.properties.configValue.properties.username"
      required
      @update:model-value="updateField('username', $event)"
    />

    <TipInput
      ref="passwordRef"
      :model-value="modelValue.password"
      type="password"
      :label="t('views.setup.steps.step5.form.password.label')"
      :placeholder="t('views.setup.steps.step5.form.password.placeholder')"
      :hint="t('views.setup.steps.step5.form.password.hint')"
      :schema="SMTPConfigUpsertDTO.properties.configValue.properties.password"
      required
      @update:model-value="updateField('password', $event)"
    />

    <div class="pt-1">
      <ButtonSecondary
        class="text-[14px] text-accent!"
        :text="
          isAdvancedExpanded
            ? t('views.setup.steps.step5.form.advanced.hide')
            : t('views.setup.steps.step5.form.advanced.show')
        "
        @click="emit('update:isAdvancedExpanded', !isAdvancedExpanded)"
      >
        <AdvancedToggle :expanded="isAdvancedExpanded" />
      </ButtonSecondary>

      <div ref="advancedContentRef">
        <div v-if="isAdvancedExpanded" class="flex flex-col gap-4 mt-3">
          <TipInput
            ref="senderEmailRef"
            :model-value="modelValue.senderEmail || ''"
            type="email"
            :label="t('views.setup.steps.step5.form.senderEmail.label')"
            :placeholder="
              t('views.setup.steps.step5.form.senderEmail.placeholder')
            "
            :hint="t('views.setup.steps.step5.form.senderEmail.hint')"
            :schema="
              SMTPConfigUpsertDTO.properties.configValue.properties.senderEmail
            "
            @update:model-value="updateField('senderEmail', $event)"
          />

          <TipInput
            ref="senderNameRef"
            :model-value="modelValue.senderName || ''"
            :label="t('views.setup.steps.step5.form.senderName.label')"
            :placeholder="
              t('views.setup.steps.step5.form.senderName.placeholder')
            "
            :hint="t('views.setup.steps.step5.form.senderName.hint')"
            :schema="
              SMTPConfigUpsertDTO.properties.configValue.properties.senderName
            "
            @update:model-value="updateField('senderName', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
