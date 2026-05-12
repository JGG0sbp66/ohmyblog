<!-- src/views/admin/components/posts/layout/PostsNav.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useLang } from "@/composables/lang.hook";
import { createPost } from "@/api/post.api";

const { t } = useLang();

const route = useRoute();
const router = useRouter();
const creating = ref(false);

const activeId = computed(() =>
  route.path.includes("/edit") ? "editor" : "list",
);

const handleListClick = () => {
  router.push("/admin/posts");
};

const preloadEditor = () => import("@/views/admin/pages/posts/PostEditor.page.vue");

const handleNewPost = async () => {
  if (creating.value) return;
  creating.value = true;
  try {
    const result = await createPost();
    if (result?.post?.uuid) {
      router.push({ name: "post-edit", params: { uuid: result.post.uuid } });
    }
  } finally {
    creating.value = false;
  }
};
</script>

<template>
  <nav class="flex items-center gap-2">
    <ButtonSecondary
      :text="t('components.common.admin.PostsNav.nav.list')"
      :isActive="activeId === 'list'"
      class="h-11 px-4"
      @click="handleListClick"
    />
    <ButtonSecondary
      :text="t('components.common.admin.PostsNav.nav.editor')"
      :isActive="activeId === 'editor'"
      :loading="creating"
      :disabled="creating"
      class="h-11 px-4"
      @mouseenter="preloadEditor"
      @click="handleNewPost"
    />
  </nav>
</template>
