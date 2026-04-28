<!-- src/views/admin/components/settings/sections/admin/SocialLinkListEditor.vue -->
<script setup lang="ts">
import ListEditorLayout from "@/components/common/list/ListEditorLayout.vue";
import ListRowLayout from "@/components/common/list/ListRowLayout.vue";
import SocialLinkRowEditor from "./SocialLinkRowEditor.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import { useListEditor } from "@/composables/list-editor.hook";

const { t } = useLang();
const systemStore = useSystemStore();

const PAGE_SIZE = 5;

/**
 * 列表管理逻辑：复用页脚链接相同的 Hook
 */
const {
  items,
  currentPage,
  totalPages,
  pagedRows,
  addItem: addLink,
  removeItem: removeRow,
  updateItem,
} = useListEditor({
  initialSource: systemStore.personalInfo.socialLinks,
  pageSize: PAGE_SIZE,
  mapToLocal: (link) => link,
  mapToRemote: (body) => body,
  onSync: (newLinks) => {
    systemStore.personalInfo.socialLinks = newLinks;
  },
  newItemFactory: () => ({ name: "", url: "", iconLight: "", iconDark: "" }),
});
</script>

<template>
  <ListEditorLayout
    :title="t('views.admin.Settings.admin.social.links.title')"
    :count="items.length"
    :add-text="t('views.admin.Settings.admin.social.links.add')"
    :show-pagination="items.length > PAGE_SIZE"
    :current-page="currentPage"
    :total-pages="totalPages"
    @add="addLink"
    @update:current-page="currentPage = $event"
  >
    <TransitionGroup
      name="list-item-anim"
      tag="div"
      class="relative flex flex-col gap-3"
      :key="currentPage"
      appear
    >
      <ListRowLayout
        v-for="row in pagedRows"
        :key="row.id"
        @remove="removeRow(row.id)"
      >
        <SocialLinkRowEditor
          :id="row.id"
          :name="row.name"
          :url="row.url"
          :icon-light="row.iconLight || null"
          :icon-dark="row.iconDark || null"
          @update="updateItem"
        />
      </ListRowLayout>
    </TransitionGroup>
  </ListEditorLayout>
</template>
