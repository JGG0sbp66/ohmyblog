<!-- src/views/main/components/friends/FriendLinkCard.vue -->
<!--
  友链卡片组件。
  展示单条已通过友链的圆形头像、站点名、域名、简介、标签和入驻日期，
  点击后在新标签页打开目标站点。
  使用 BaseCard 包裹，通过 class prop 附加 border。
-->
<script setup lang="ts">
import { computed } from "vue";
import { ExternalLink } from "lucide-vue-next";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import BaseCard from "@/components/base/card/BaseCard.vue";
import { useLang } from "@/composables/lang.hook";
import { getFriendLinkDomain, getFriendLinkInitial } from "@/utils/friend-link";
import { formatDate } from "@/utils/date";
import type { FriendLinkItem } from "@/api/friend-link.api";

const props = defineProps<{
  link: FriendLinkItem;
}>();

const { locale } = useLang();

const domain = computed(() => getFriendLinkDomain(props.link.url));
const joinedDate = computed(() => formatDate(props.link.joinedAt, locale.value));
const initial = computed(() => getFriendLinkInitial(props.link.name));
</script>

<template>
  <a
    :href="link.url"
    target="_blank"
    rel="noopener noreferrer"
    class="block group"
  >
    <BaseCard
      padding="none"
      class="flex flex-col gap-3 p-4 border border-border shadow-none
             cursor-pointer
             hover:border-accent/40 hover:-translate-y-1
             transition-all duration-200"
    >
      <!-- 头部：头像 + 站点名 + 域名 -->
      <div class="flex items-center gap-3">
        <!-- 圆形头像 -->
        <div
          class="shrink-0 w-16 h-16 rounded-full overflow-hidden
                 bg-accent/10 flex items-center justify-center"
        >
          <img
            v-if="link.avatarUrl"
            :src="link.avatarUrl"
            :alt="link.name"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-base font-bold text-accent">{{ initial }}</span>
        </div>

        <!-- 名称 + 域名 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1 min-w-0">
            <span class="font-semibold text-sm text-fg truncate">{{ link.name }}</span>
            <ExternalLink
              class="w-3 h-3 shrink-0 text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            />
          </div>
          <p class="text-[11px] font-mono text-fg-subtle truncate mt-0.5">
            {{ domain }}
          </p>
        </div>
      </div>

      <!-- 简介 -->
      <p
        v-if="link.description"
        class="text-xs text-fg-muted leading-relaxed line-clamp-2"
      >
        {{ link.description }}
      </p>

      <!-- 标签 + 入驻日期 -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-wrap gap-1 min-w-0">
          <BaseTag
            v-for="tag in (link.tags ?? []).slice(0, 3)"
            :key="tag"
            type="primary"
            :show-icon="false"
          >
            {{ tag }}
          </BaseTag>
        </div>
        <span
          v-if="joinedDate"
          class="text-[10px] text-fg-subtle/60 shrink-0 whitespace-nowrap"
        >
          {{ joinedDate }}
        </span>
      </div>
    </BaseCard>
  </a>
</template>
