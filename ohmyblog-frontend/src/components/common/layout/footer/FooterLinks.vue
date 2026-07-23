<!-- src/components/common/layout/footer/FooterLinks.vue -->
<script setup lang="ts">
import { useSystemStore } from "@/stores/system.store";
import { storeToRefs } from "pinia";
import ButtonThird from "@/components/base/button/ButtonThird.vue";
import { isExternalLink, normalizeInternalPath } from "@/utils/url";

const { siteInfo } = storeToRefs(useSystemStore());
</script>

<template>
  <div
    v-if="siteInfo.footerLinks && siteInfo.footerLinks.length > 0"
    class="flex-1 flex flex-wrap gap-x-12 gap-y-6 md:gap-x-30 md:justify-end"
  >
    <div
      v-for="(group, gIndex) in siteInfo.footerLinks"
      :key="gIndex"
      class="flex flex-col gap-2"
    >
      <!-- 分组标题 -->
      <h3 class="text-[13px] font-semibold text-fg tracking-wide px-1">
        {{ group.title }}
      </h3>
      <!-- 分组链接：HTTP(S) 外链新窗口打开并显示箭头，其余链接走站内路由 -->
      <div class="flex flex-col gap-2">
        <div v-for="(link, lIndex) in group.links" :key="lIndex">
          <ButtonThird
            :text="
              isExternalLink(link.url) ? `${link.name} ↗` : link.name
            "
            :href="isExternalLink(link.url) ? link.url : undefined"
            :to="
              isExternalLink(link.url)
                ? undefined
                : normalizeInternalPath(link.url)
            "
            :target="isExternalLink(link.url) ? '_blank' : undefined"
            :rel="
              isExternalLink(link.url) ? 'noopener noreferrer' : undefined
            "
            class="text-[13px]!"
          />
        </div>
      </div>
    </div>
  </div>
</template>
