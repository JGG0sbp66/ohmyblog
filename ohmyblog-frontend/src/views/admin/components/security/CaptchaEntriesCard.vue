<!-- src/views/admin/components/security/CaptchaEntriesCard.vue -->
<!--
  验证码入口卡片。

  控制哪些页面/场景需要过人机验证。每个入口一个开关。
-->
<script setup lang="ts">
import SettingCard from "@/components/base/card/SettingCard.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ModuleItem from "@/components/common/item/ModuleItem.vue";
import { useLang } from "@/composables/lang.hook";

export interface CaptchaScenesForm {
  login: boolean;
  forgotPassword: boolean;
  friendApply: boolean;
}

defineProps<{
  /** 场景开关组由父级持有，本卡片只就地编辑嵌套字段，所以是 prop 而非 v-model */
  scenes: CaptchaScenesForm;
  isLoaded: boolean;
  isSaving: boolean;
}>();

const emit = defineEmits<{
  save: [];
  /** 用户点击了某个入口条目，抛出对应的索引 */
  "scene-focus": [index: number];
}>();

const { t } = useLang();
</script>

<template>
  <SettingCard
    :title="t('views.admin.Security.scenes.label')"
    :description="t('views.admin.Security.scenes.hint')"
  >
    <div class="flex flex-col gap-3">
      <ModuleItem
        v-model="scenes.login"
        :loading="!isLoaded"
        :title="t('views.admin.Security.scenes.login.title')"
        :description="t('views.admin.Security.scenes.login.description')"
        @click="emit('scene-focus', 0)"
      />
      <ModuleItem
        v-model="scenes.forgotPassword"
        :loading="!isLoaded"
        :title="t('views.admin.Security.scenes.forgotPassword.title')"
        :description="
          t('views.admin.Security.scenes.forgotPassword.description')
        "
        @click="emit('scene-focus', 1)"
      />
      <ModuleItem
        v-model="scenes.friendApply"
        :loading="!isLoaded"
        :title="t('views.admin.Security.scenes.friendApply.title')"
        :description="t('views.admin.Security.scenes.friendApply.description')"
        @click="emit('scene-focus', 2)"
      />
    </div>

    <!-- 保存按钮 -->
    <div class="flex justify-end pt-4">
      <ButtonPrimary
        :text="t('common.save')"
        :loading="isSaving"
        class="w-full sm:w-auto px-8"
        @click="emit('save')"
      />
    </div>
  </SettingCard>
</template>
