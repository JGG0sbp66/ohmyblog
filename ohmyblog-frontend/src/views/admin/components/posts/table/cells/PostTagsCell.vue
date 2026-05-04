<!-- src/views/admin/components/posts/table/cells/PostTagsCell.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useLang } from "@/composables/lang.hook";
import BaseTag from "@/components/base/tag/BaseTag.vue";

const props = defineProps<{
  tags: string[];
}>();

const { t } = useLang();

const MAX_TAGS = 2;

/** 获取显示的标签列表 */
const visibleTags = computed(() => props.tags.slice(0, MAX_TAGS));

/** 获取超出部分的数量 */
const extraCount = computed(() => Math.max(0, props.tags.length - MAX_TAGS));
</script>

<template>
  <div class="w-36 shrink-0 flex items-center gap-1 flex-wrap" @click.stop>
    <template v-if="tags.length > 0">
      <BaseTag
        v-for="tag in visibleTags"
        :key="tag"
        type="info"
        class="whitespace-nowrap!"
      >
        {{ tag }}
      </BaseTag>
      <BaseTag v-if="extraCount > 0" type="info"> +{{ extraCount }} </BaseTag>
    </template>
    <BaseTag v-else type="info">
      {{ t("views.admin.Posts.table.noTags") }}
    </BaseTag>
  </div>
</template>
