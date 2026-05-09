// src/composables/post-editor.hook.ts
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { watchDebounced } from "@vueuse/core";
import limax from "limax";
import type { TPostStatus } from "@server/db/constants/post.constants";
import { getPostById, savePost, updatePostStatus } from "@/api/post.api";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";

/**
 * usePostEditor — 文章编辑器状态 & 保存逻辑
 *
 * 职责：
 * - 从路由参数 uuid 加载已有文章数据，初始化表单
 * - 持有编辑器各字段的响应式状态（slug、tags、status、TODO: title/content 等）
 * - 提供 save() 方法：并行调用 savePost + updatePostStatus
 *
 * 用法：在 PostEditor.page.vue 中调用，通过 v-model 传递给子组件
 */
export const usePostEditor = () => {
  const route = useRoute();
  const uuid = route.params.uuid as string;
  const { t } = useLang();

  // --- 表单状态 ---
  const slug = ref("");
  const tags = ref<string[]>([]);
  const status = ref<TPostStatus>("draft");
  const title = ref("");
  const content = ref<object | undefined>(undefined);
  const contentMarkdown = ref("");
  const contentText = ref("");
  const coverImage = ref<string | null>(null);
  const excerpt = ref("");

  // --- UI 状态 ---
  const isSaving = ref(false);
  const isLoading = ref(false);
  /** 是否有未保存的更改 */
  const isDirty = ref(false);

  /** 加载已有文章数据并填充表单 */
  const loadPost = async () => {
    isLoading.value = true;
    try {
      const result = await getPostById(uuid);
      const post = result?.post;
      if (!post) return;
      slug.value = post.slug ?? "";
      tags.value = post.tags ?? [];
      status.value = post.status as TPostStatus;
      title.value = post.title ?? "";
      content.value = (post.content as object) ?? undefined;
      coverImage.value = post.coverImage ?? null;
      excerpt.value = post.excerpt ?? "";
    } catch {
      useToast.error("加载文章失败");
    } finally {
      isLoading.value = false;
      // 加载完成后才开始监听变化，防止初始赋值触发 isDirty
      // deep: true — 捕获 tags 数组的 push/splice 就地变更（浅监听感知不到引用未变的数组修改）
      watch([slug, tags, status, title, content, excerpt], () => {
        isDirty.value = true;
      }, { deep: true });
      // 标题变化时自动同步 slug：
      // - slug 为空，或 slug 仍等于上次自动生成的值 → 继续同步（用户一直在打标题）
      // - slug 与上次生成值不同 → 说明用户手动修改过，停止同步
      let lastAutoSlug = slug.value; // 记录上次自动生成的 slug
      watch(title, (newTitle) => {
        if (slug.value === "" || slug.value === lastAutoSlug) {
          lastAutoSlug = limax(newTitle);
          slug.value = lastAutoSlug;
        }
      });
      // title/content 防抖自动保存
      watchDebounced(
        [title, content, contentMarkdown, contentText, coverImage, excerpt, tags, slug],
        () => {
          if (!isDirty.value) return;
          autoSave();
        },
        { debounce: 2000, maxWait: 8000, deep: true },
      );
    }
  };

  const buildSavePayload = () => ({
    slug: slug.value || undefined,
    tags: tags.value,
    title: title.value || undefined,
    content: content.value,
    contentMarkdown: contentMarkdown.value || undefined,
    contentText: contentText.value || undefined,
    coverImage: coverImage.value ?? undefined,
    excerpt: excerpt.value || undefined,
  });

  const autoSave = async () => {
    if (isSaving.value) return;
    isSaving.value = true;
    try {
      await savePost(uuid, buildSavePayload());
      isDirty.value = false;
    } catch (error: any) {
      useToast.error(t(`api.errors.${error}`));
    } finally {
      isSaving.value = false;
    }
  };

  /**
   * 保存文章
   *
   * 分两步并行执行：
   * 1. savePost() — 保存内容字段（slug、tags、TODO: title/content 等）
   * 2. updatePostStatus() — 更新文章状态（独立接口）
   */
  const save = async () => {
    if (isSaving.value) return;
    isSaving.value = true;
    try {
      await Promise.all([
        savePost(uuid, buildSavePayload()),
        updatePostStatus(uuid, status.value),
      ]);
      isDirty.value = false;
      useToast.success(t("api.success.保存成功"));
    } catch (error: any) {
      useToast.error(t(`api.errors.${error}`));
    } finally {
      isSaving.value = false;
    }
  };

  onMounted(loadPost);

  return {
    uuid,
    slug,
    tags,
    status,
    title,
    content,
    contentMarkdown,
    contentText,
    coverImage,
    excerpt,
    isSaving,
    isLoading,
    isDirty,
    save,
  };
};
