<!-- src/views/setup/components/SMTPForm.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import AdvancedToggle from "@/components/icon/AdvancedToggle.vue";
import { useLang } from "@/composables/lang.hook";
import { useSetupStore } from "@/stores/setup.store";
import { type Validatable } from "@/composables/setup-step.hook";
import { SMTPConfigUpsertDTO } from "@server/dtos/config.dto";
import { useAutoAnimate } from "@formkit/auto-animate/vue";

const { t } = useLang();
const setupStore = useSetupStore();
const [advancedContentRef] = useAutoAnimate();

// 四个输入框对应的可校验引用（由 TipInput 暴露 validate）
const hostRef = ref<Validatable | null>(null);
const portRef = ref<Validatable | null>(null);
const usernameRef = ref<Validatable | null>(null);
const passwordRef = ref<Validatable | null>(null);
const senderEmailRef = ref<Validatable | null>(null);
const senderNameRef = ref<Validatable | null>(null);

// 聚合校验入口：供 Step5 的“下一步”统一触发
const validate = () => {
  const baseFieldValid = [
    hostRef.value?.validate?.() ?? false,
    portRef.value?.validate?.() ?? false,
    usernameRef.value?.validate?.() ?? false,
    passwordRef.value?.validate?.() ?? false,
  ].every((res) => res === true);

  // 高级字段策略：
  // - 展开高级选项：senderEmail / senderName 视为必填并参与校验
  // - 收起高级选项：跳过高级字段校验
  const senderEmailValid = setupStore.isSMTPAdvancedExpanded
    ? (senderEmailRef.value?.validate?.() ?? false)
    : true;
  const senderNameValid = setupStore.isSMTPAdvancedExpanded
    ? (senderNameRef.value?.validate?.() ?? false)
    : true;

  return baseFieldValid && senderEmailValid && senderNameValid;
};

// 当前组件挂载时，把校验器注册给 store
// 这样无论表单渲染在左侧（桌面）还是右侧（窄屏），都能被同一个入口调用
onMounted(() => {
  setupStore.setSmtpFormValidator(validate);
});

// 卸载时清理注册，避免引用过期组件实例
onBeforeUnmount(() => {
  setupStore.setSmtpFormValidator(null);
});

defineExpose({ validate });
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TipInput
        ref="hostRef"
        v-model="setupStore.smtpForm.host"
        :label="t('views.setup.steps.step5.form.host.label')"
        :placeholder="t('views.setup.steps.step5.form.host.placeholder')"
        :schema="SMTPConfigUpsertDTO.properties.configValue.properties.host"
        required
      />

      <TipInput
        ref="portRef"
        v-model.number="setupStore.smtpForm.port"
        type="number"
        :label="t('views.setup.steps.step5.form.port.label')"
        :placeholder="t('views.setup.steps.step5.form.port.placeholder')"
        :schema="SMTPConfigUpsertDTO.properties.configValue.properties.port"
        required
      />
    </div>

    <TipInput
      ref="usernameRef"
      v-model="setupStore.smtpForm.username"
      :label="t('views.setup.steps.step5.form.username.label')"
      :placeholder="t('views.setup.steps.step5.form.username.placeholder')"
      :schema="SMTPConfigUpsertDTO.properties.configValue.properties.username"
      required
    />

    <TipInput
      ref="passwordRef"
      v-model="setupStore.smtpForm.password"
      type="password"
      :label="t('views.setup.steps.step5.form.password.label')"
      :placeholder="t('views.setup.steps.step5.form.password.placeholder')"
      :schema="SMTPConfigUpsertDTO.properties.configValue.properties.password"
      required
    />

    <div class="pt-1">
      <ButtonSecondary
        class="text-[14px] text-accent!"
        :text="
          setupStore.isSMTPAdvancedExpanded
            ? t('views.setup.steps.step5.form.advanced.hide')
            : t('views.setup.steps.step5.form.advanced.show')
        "
        @click="setupStore.isSMTPAdvancedExpanded = !setupStore.isSMTPAdvancedExpanded"
      >
        <AdvancedToggle :expanded="setupStore.isSMTPAdvancedExpanded" />
      </ButtonSecondary>

      <!-- 高级字段仅在展开时渲染：与“展开即必填”的校验策略保持一致 -->
      <div ref="advancedContentRef">
        <div v-if="setupStore.isSMTPAdvancedExpanded" class="flex flex-col gap-4 mt-3">
          <!-- 展开时必填，收起时不要求 -->
          <TipInput
            ref="senderEmailRef"
            v-model="setupStore.smtpForm.senderEmail"
            type="email"
            :label="t('views.setup.steps.step5.form.senderEmail.label')"
            :placeholder="t('views.setup.steps.step5.form.senderEmail.placeholder')"
            :schema="SMTPConfigUpsertDTO.properties.configValue.properties.senderEmail"
            :required="setupStore.isSMTPAdvancedExpanded"
          />

          <!-- 展开时必填，收起时不要求 -->
          <TipInput
            ref="senderNameRef"
            v-model="setupStore.smtpForm.senderName"
            :label="t('views.setup.steps.step5.form.senderName.label')"
            :placeholder="t('views.setup.steps.step5.form.senderName.placeholder')"
            :schema="SMTPConfigUpsertDTO.properties.configValue.properties.senderName"
            :required="setupStore.isSMTPAdvancedExpanded"
          />
        </div>
      </div>
    </div>
  </div>
</template>
