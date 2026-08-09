<script setup lang="ts">
import { computed } from "vue";
import {
  BadgeCheck,
  FlaskConical,
  KeyRound,
  Link2,
  Link2Off,
  Mail,
  MailCheck,
  MailOpen,
  ShieldAlert,
} from "lucide-vue-next";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ResponsiveGroupedSelect, {
  type GroupedSelectGroup,
} from "@/components/common/input/ResponsiveGroupedSelect.vue";
import { useLang } from "@/composables/lang.hook";
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

const typeModel = computed({
  get: () => (props.type === "all" ? undefined : props.type),
  set: (value: string | undefined) =>
    emit("update:type", value as TEmailLogType | undefined),
});

const typeGroups = computed<GroupedSelectGroup[]>(() => [
  {
    key: "system",
    label: t("views.emails.filterGroups.system"),
    items: [
      {
        value: "smtp_test",
        label: t("views.emails.types.smtp_test"),
        icon: FlaskConical,
        iconClass: "text-blue-500 dark:text-blue-400",
      },
      {
        value: "login_alert",
        label: t("views.emails.types.login_alert"),
        icon: ShieldAlert,
        iconClass: "text-amber-500 dark:text-amber-400",
      },
      {
        value: "reset_password",
        label: t("views.emails.types.reset_password"),
        icon: KeyRound,
        iconClass: "text-violet-500 dark:text-violet-400",
      },
    ],
  },
  {
    key: "friendLinks",
    label: t("views.emails.filterGroups.friendLinks"),
    items: [
      {
        value: "friend_link_apply",
        label: t("views.emails.types.friend_link_apply"),
        icon: Link2,
        iconClass: "text-cyan-500 dark:text-cyan-400",
      },
      {
        value: "friend_link_apply_confirmed",
        label: t("views.emails.types.friend_link_apply_confirmed"),
        icon: MailCheck,
        iconClass: "text-sky-500 dark:text-sky-400",
      },
      {
        value: "friend_link_approved",
        label: t("views.emails.types.friend_link_approved"),
        icon: BadgeCheck,
        iconClass: "text-emerald-500 dark:text-emerald-400",
      },
      {
        value: "friend_link_rejected",
        label: t("views.emails.types.friend_link_rejected"),
        icon: Link2Off,
        iconClass: "text-rose-500 dark:text-rose-400",
      },
    ],
  },
]);
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
