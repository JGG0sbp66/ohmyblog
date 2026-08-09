<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { X } from "lucide-vue-next";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import UnreadBadge from "@/components/base/tag/UnreadBadge.vue";
import EmailListCard from "@/views/admin/components/emails/EmailListCard.vue";
import { useLang } from "@/composables/lang.hook";
import type { EmailLogItem } from "@/views/admin/components/emails/types";

withDefaults(
  defineProps<{
    items: EmailLogItem[];
    unreadCount: number;
    showSkeleton: boolean;
    showEmpty: boolean;
    isMarkingRead: boolean;
    mobile?: boolean;
  }>(),
  { mobile: false },
);

const emit = defineEmits<{
  "mark-all-read": [];
  "card-click": [item: EmailLogItem];
  "view-all": [];
  close: [];
  "scroll-container": [element: HTMLElement | null];
}>();

const { t } = useLang();
const scrollContainer = ref<HTMLElement | null>(null);

watch(scrollContainer, (element) => emit("scroll-container", element), {
  flush: "post",
});

onBeforeUnmount(() => emit("scroll-container", null));
</script>

<template>
  <div class="flex min-h-0 flex-col overflow-hidden">
    <div
      class="flex shrink-0 items-center justify-between gap-2 pb-3"
      :class="mobile ? '' : 'px-4 pt-4'"
    >
      <div class="flex min-w-0 items-center gap-1.5">
        <span class="truncate text-base font-bold text-fg">
          {{ t("views.emails.filters.unread") }}
        </span>
        <UnreadBadge :count="unreadCount" :is-expanded="true" />
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <ButtonPrimary
          class="text-xs"
          :text="t('components.common.button.NotificationButton.markAllRead')"
          :loading="isMarkingRead"
          :disabled="unreadCount === 0"
          @click="emit('mark-all-read')"
        />
        <div v-if="mobile" class="h-9 w-9">
          <ButtonSecondary
            class="h-full! w-full! p-0!"
            :aria-label="t('components.common.button.NotificationButton.close')"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </ButtonSecondary>
        </div>
      </div>
    </div>

    <div
      ref="scrollContainer"
      class="notification-list overflow-y-auto border-t border-fg-muted/10"
      :class="mobile ? '-mx-4 max-h-[52dvh]' : 'max-h-80'"
    >
      <div v-if="showSkeleton" class="flex flex-col">
        <div
          v-for="i in 3"
          :key="i"
          class="h-24 shrink-0 animate-pulse border-b border-fg-muted/10 bg-bg-muted-soft"
        />
      </div>

      <div
        v-else-if="showEmpty"
        class="flex items-center justify-center py-8 text-sm text-fg-subtle"
      >
        {{ t("components.common.button.NotificationButton.empty") }}
      </div>

      <template v-else>
        <EmailListCard
          v-for="item in items"
          :key="item.uuid"
          :item="item"
          @click="emit('card-click', item)"
        />
      </template>
    </div>

    <div
      class="shrink-0 border-t border-fg-muted/10 py-3"
      :class="mobile ? '' : 'px-4'"
    >
      <ButtonSecondary
        class="w-full! justify-center! py-2! text-sm!"
        :text="t('components.common.button.NotificationButton.viewAll')"
        @click="emit('view-all')"
      />
    </div>
  </div>
</template>

<style scoped>
.notification-list {
  scrollbar-width: none;
}

.notification-list::-webkit-scrollbar {
  width: 0;
}
</style>
