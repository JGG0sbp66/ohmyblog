<!-- src/views/admin/components/settings/sections/smtp/SMTPSettingsForm.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ModuleItem from "@/components/common/item/ModuleItem.vue";
import SMTPForm from "@/components/common/smtp/SMTPForm.vue";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { getConfig, upsertConfig } from "@/api/config.api";

const { t } = useLang();
const toast = useToast;

// 内部维护表单数据。
// enabled 默认关：没存过 smtp 配置时 GET /config/smtp 会 404，此时开关必须
// 落在「关」上，与后端「无配置即不可发信」的行为一致；存过则被 loadConfig 覆盖
const formData = ref({
  enabled: false,
  host: "",
  port: 587,
  username: "",
  password: "",
  senderEmail: "",
  senderName: "",
});

const isAdvancedExpanded = ref(false);
const formRef = ref<InstanceType<typeof SMTPForm> | null>(null);
const isSaving = ref(false);
// 配置拉取完成前不渲染开关：toggle 先按默认值渲染再翻转到真实状态，
// 会播放一段不属于任何用户操作的假动画
const isLoaded = ref(false);
const [parentRef] = useAutoAnimate();

/**
 * 加载 SMTP 配置
 */
const loadConfig = async () => {
  try {
    const res = await getConfig("smtp");
    if (res?.config?.configValue) {
      // 合并数据，保持默认值
      formData.value = {
        ...formData.value,
        ...(res.config.configValue as any),
      };
    }
  } catch (error) {
    // 404 可能是还没配置过，忽略
    console.warn(
      "Failed to load SMTP config, it might not be initialized yet.",
    );
  } finally {
    isLoaded.value = true;
  }
};

/**
 * 保存配置
 */
const handleSave = async () => {
  // 仅在开启状态下进行表单校验
  if (formData.value.enabled && !formRef.value?.validate?.()) return;

  try {
    isSaving.value = true;
    await upsertConfig({
      configKey: "smtp",
      configValue: formData.value,
      isPublic: false, // 敏感信息，不公开
    });
    toast.success(t("api.success.保存成功"));
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  loadConfig();
});

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
