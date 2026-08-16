<!-- src/views/admin/components/settings/sections/smtp/SMTPSettingsForm.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ModuleItem from "@/components/common/item/ModuleItem.vue";
import SMTPForm from "@/components/common/smtp/SMTPForm.vue";
import { useLang } from "@/composables/lang.hook";
import { useConfigForm } from "@/composables/config-form.hook";
import type { TSMTPConfigUpsertDTO } from "@server/dtos/config.dto";

const { t } = useLang();

// 读写机制（404 = 未配置 = 保持默认值）由 useConfigForm 收敛，
// 这里只声明语义：默认值是什么、属于敏感配置不公开
const { formData, isLoaded, isSaving, load, save } = useConfigForm<
  TSMTPConfigUpsertDTO["configValue"]
>("smtp", {
  enabled: false,
  host: "",
  port: 465,
  username: "",
  password: "",
  senderEmail: "",
  senderName: "",
});

const isAdvancedExpanded = ref(false);
const formRef = ref<InstanceType<typeof SMTPForm> | null>(null);
const [parentRef] = useAutoAnimate();

/**
 * 保存配置
 */
const handleSave = async () => {
  // 仅在开启状态下进行表单校验；请求与 toast 由 useConfigForm 负责
  if (formData.value.enabled && !formRef.value?.validate?.()) return;
  await save();
};

onMounted(load);

defineExpose({
  formData,
});
</script>

<template>
  <SettingCard
    :title="t('views.setup.steps.step5.title')"
    :description="t('views.setup.steps.step5.description')"
  >
    <div ref="parentRef" class="flex flex-col gap-6">
      <ModuleItem
        v-model="formData.enabled"
        :loading="!isLoaded"
        :title="t('views.setup.steps.step5.smtp.title')"
        :description="t('views.setup.steps.step5.smtp.description')"
      />

      <!-- 表单依赖接口数据，加载完成前不渲染 -->
      <template v-if="isLoaded">
        <template v-if="formData.enabled">
          <SMTPForm
            ref="formRef"
            v-model="formData"
            v-model:is-advanced-expanded="isAdvancedExpanded"
          />

          <!-- 操作按钮 -->
          <div class="flex justify-end pt-4">
            <ButtonPrimary
              :text="t('common.save')"
              :loading="isSaving"
              class="w-full sm:w-auto px-8"
              @click="handleSave"
            />
          </div>
        </template>

        <!-- 未开启时的保存按钮（仅保存开关状态） -->
        <div v-else class="flex justify-end pt-4">
          <ButtonPrimary
            :text="t('common.save')"
            :loading="isSaving"
            class="w-full sm:w-auto px-8"
            @click="handleSave"
          />
        </div>
      </template>
    </div>
  </SettingCard>
</template>
