<!-- 
  src/views/admin/components/emails/EmailListActions.vue 
  邮件列表操作区域组件
  - 提供状态过滤切换（成功、失败）
  - 提供更多操作菜单（刷新、清空等）
-->
<script setup lang="ts">
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import DropButton from "@/components/common/button/DropButton.vue";
import { Ellipsis, Mail, MailOpen } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import { emailLogTypes } from "@/api/shared";
import type { TEmailLogType } from "@/api/shared";

const props = defineProps<{
  isRead?: boolean;
  type?: TEmailLogType | "all";
}>();

const emit = defineEmits<{
  "update:isRead": [value: boolean | undefined];
  "update:type": [value: TEmailLogType | undefined];
}>();

const { t } = useLang();

const setIsRead = (val: boolean | undefined) => {
  emit("update:isRead", val);
};

const setType = (val: TEmailLogType | undefined) => {
  emit("update:type", val);
};
</script>

<template>
  <div
    class="p-4 border-b border-border/40 flex items-center justify-between gap-2"
  >
    <!-- 已读/未读切换 -->
    <div class="flex items-center gap-1.5 p-1 bg-bg-muted-soft rounded-2xl">
      <div class="h-9">
        <ButtonSecondary
          class="w-full h-full text-sm"
          :isActive="isRead === undefined"
          :text="t('views.emails.filters.all')"
          gap="1.5"
          @click="setIsRead(undefined)"
        >
          <Mail class="w-3.5 h-3.5" />
        </ButtonSecondary>
      </div>
      <div class="h-9">
        <ButtonSecondary
          class="w-full h-full text-sm"
          :isActive="isRead === false"
          :text="t('views.emails.filters.unread')"
          gap="1.5"
          @click="setIsRead(false)"
        >
          <MailOpen class="w-3.5 h-3.5" />
        </ButtonSecondary>
      </div>
    </div>

    <!-- 更多操作 -->
    <DropButton
      contentClass="min-w-40 p-2"
      placement="-right-10"
      trigger-class="w-fit"
    >
      <template #trigger="{ active }">
        <ButtonSecondary
          :isActive="active"
          class="w-full h-full px-3 text-sm"
          :text="
            props.type && props.type !== 'all'
              ? t(`views.emails.types.${props.type}`)
              : t('views.emails.filters.type')
          "
          gap="1.5"
        >
          <Ellipsis class="w-3.5 h-3.5" />
        </ButtonSecondary>
      </template>
      <template #content>
        <div class="flex flex-col gap-1">
          <ButtonSecondary
            class="w-full justify-start px-3 py-2 text-sm"
            :isActive="type === undefined || type === 'all'"
            :text="t('views.emails.filters.all')"
            @click="setType(undefined)"
          />
          <div class="h-px bg-border/40 my-1"></div>
          <ButtonSecondary
            v-for="item in emailLogTypes"
            :key="item"
            class="w-full justify-start px-3 py-2 text-sm"
            :isActive="type === item"
            :text="t(`views.emails.types.${item}`)"
            @click="setType(item)"
          />
        </div>
      </template>
    </DropButton>
  </div>
</template>
