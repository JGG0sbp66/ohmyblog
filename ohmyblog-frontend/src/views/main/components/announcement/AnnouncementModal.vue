<!-- src/views/main/components/announcement/AnnouncementModal.vue -->
<script setup lang="ts">
import { RiMegaphoneLine } from "@remixicon/vue";
import BaseModal from "@/components/base/pop/BaseModal.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import { useLang } from "@/composables/lang.hook";
import { useAnnouncement } from "./use-announcement";

/**
 * AnnouncementModal — 公告全文弹窗
 *
 * 刻意不用 ConfirmModal：那个组件是为「确认 / 取消」的二选一决策做的，
 * 默认警示图标 + 焊死的两个按钮，而公告是告知，不需要用户做决定。
 * 这里直接用底层的 BaseModal，只留一个「我知道了」。
 */
const open = defineModel<boolean>({ default: false });

const { t } = useLang();
const { title, content } = useAnnouncement();
</script>

<template>
  <BaseModal v-model="open" max-width="max-w-md">
    <template #header>
      <div class="flex items-center gap-2">
        <RiMegaphoneLine class="w-5 h-5 shrink-0 text-accent" />
        <h2 class="text-xl font-bold text-fg">{{ title }}</h2>
      </div>
    </template>

    <!-- 正文：纯文本，保留换行；超长时弹窗内部滚动，不把窗撑出屏幕 -->
    <p
      class="text-sm text-fg-muted font-medium leading-relaxed whitespace-pre-line break-words max-h-[60vh] overflow-y-auto"
    >
      {{ content }}
    </p>

    <template #footer>
      <ButtonPrimary
        :text="t('views.main.announcement.gotIt')"
        class="min-w-24 py-2"
        @click="open = false"
      />
    </template>
  </BaseModal>
</template>
