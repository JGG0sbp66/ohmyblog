<!-- src/views/admin/components/settings/sections/smtp/SMTPSection.vue -->
<script setup lang="ts">
import { ref } from "vue";
import EmailPreview from "./EmailPreview.vue";
import SMTPSettingsForm from "./SMTPSettingsForm.vue";
import SettingsPageLayout from "../../layout/SettingsPageLayout.vue";

const formRef = ref<InstanceType<typeof SMTPSettingsForm> | null>(null);
</script>

<template>
  <SettingsPageLayout>
    <template #preview>
      <EmailPreview
        :sender-name="formRef?.formData.senderName || 'ohmyblog'"
        :sender-email="formRef?.formData.senderEmail || 'noreply@ohmyblog.com'"
      />
    </template>

    <SMTPSettingsForm ref="formRef" />
  </SettingsPageLayout>
</template>

