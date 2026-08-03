<!-- src/views/admin/components/posts/layout/PostsNav.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { DEMO_DRAFT_UUID } from "@/composables/post-editor.hook";
import { useAuthStore } from "@/stores/auth.store";
import { createPost } from "@/api/post.api";

const { t } = useLang();
const authStore = useAuthStore();

const route = useRoute();
const router = useRouter();
const creating = ref(false);

const activeId = computed(() =>
  route.path.includes("/edit") ? "editor" : "list",
);

const handleListClick = () => {
  router.push("/admin/posts");
};

const preloadEditor = () =>
  import("@/views/admin/pages/posts/PostEditor.page.vue");

const handleNewPost = async () => {
  if (creating.value) return;

  // 演示模式：创建接口会被 403 拦掉，改为跳到虚拟草稿，
  // 让访客照样能看到并试用完整的编辑器（只是存不下来）
  if (authStore.isDemoUser) {
    router.push({ name: "post-edit", params: { uuid: DEMO_DRAFT_UUID } });
    return;
  }

  creating.value = true;
  try {
    const result = await createPost();
    // 没拿到 uuid 就没法跳转，当失败处理，否则按钮看上去毫无反应
    if (!result?.post?.uuid) throw new Error("Error");
    router.push({ name: "post-edit", params: { uuid: result.post.uuid } });
  } catch (error: any) {
    // 这里的 error 可能是 string (unwrap 抛出) 或 Error 对象
    const errorMsg =
      typeof error === "string" ? error : error?.message || "Error";
    useToast.error(t(`api.errors.${errorMsg}`));
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
