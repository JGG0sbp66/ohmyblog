<script setup lang="ts">
import { computed } from "vue";
import { Mail, MailOpen } from "lucide-vue-next";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ResponsiveGroupedSelect, {
  type GroupedSelectGroup,
} from "@/components/common/input/ResponsiveGroupedSelect.vue";
import { useLang } from "@/composables/lang.hook";
import { emailLogTypes, type TEmailLogType } from "@/api/shared";
import {
  emailTypeMeta,
  type EmailTypeGroup,
} from "@/views/admin/components/emails/email-type-meta";

const props = defineProps<{
  isRead?: boolean;
  type?: TEmailLogType | "all";
}>();

const emit = defineEmits<{
  "update:isRead": [value: boolean | undefined];
  "update:type": [value: TEmailLogType | undefined];
}>();

const { t } = useLang();

const typeModel = computed({
  get: () => (props.type === "all" ? undefined : props.type),
  set: (value: string | undefined) =>
    emit("update:type", value as TEmailLogType | undefined),
});

const typeGroupKeys: EmailTypeGroup[] = ["system", "friendLinks"];

const typeGroups = computed<GroupedSelectGroup[]>(() =>
  typeGroupKeys.map((group) => ({
    key: group,
    label: t(`views.emails.filterGroups.${group}`),
    items: emailLogTypes
      .filter((type) => emailTypeMeta[type].group === group)
      .map((type) => ({
        value: type,
        label: t(`views.emails.types.${type}`),
        icon: emailTypeMeta[type].icon,
        iconClass: emailTypeMeta[type].iconClass,
      })),
  })),
);
</script>

<template>
  <div
    class="flex items-center justify-between gap-2 border-b border-border/40 p-4"
  >
    <div class="flex items-center gap-1.5 rounded-2xl bg-bg-muted-soft p-1">
      <div class="h-9">
        <ButtonSecondary
          class="h-full w-full text-sm"
          :is-active="isRead === undefined"
          :text="t('views.emails.filters.all')"
          gap="1.5"
          @click="emit('update:isRead', undefined)"
        >
          <Mail class="h-3.5 w-3.5" />
        </ButtonSecondary>
      </div>
      <div class="h-9">
        <ButtonSecondary
          class="h-full w-full text-sm"
          :is-active="isRead === false"
          :text="t('views.emails.filters.unread')"
          gap="1.5"
          @click="emit('update:isRead', false)"
        >
          <MailOpen class="h-3.5 w-3.5" />
        </ButtonSecondary>
      </div>
    </div>

    <ResponsiveGroupedSelect
      v-model="typeModel"
      :label="t('views.emails.filters.type')"
      :all-label="t('views.emails.filters.allTypes')"
      :groups="typeGroups"
      :mobile-title="t('views.emails.filters.type')"
      :mobile-description="t('views.emails.filters.typeHint')"
      :close-label="t('views.emails.filters.close')"
    />
  </div>
</template>
