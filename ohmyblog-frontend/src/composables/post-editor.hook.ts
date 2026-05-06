// src/composables/post-editor.hook.ts
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { TPostStatus } from "@server/db/constants/post.constants";
import { getPostById, savePost, updatePostStatus } from "@/api/post.api";
import { useToast } from "@/composables/toast.hook";

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

  // --- 表单状态 ---
  const slug = ref("");
  const tags = ref<string[]>([]);
  const status = ref<TPostStatus>("draft");
  // TODO: 以下字段待 Markdown 编辑器开发完成后接入
  // const title = ref("");
  // const content = ref<object | undefined>(undefined);
  // const contentMarkdown = ref("");
  // const contentText = ref("");
  // const excerpt = ref("");
  // const coverImage = ref("");

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
      // TODO: title.value = post.title ?? "";
    } catch {
      useToast.error("加载文章失败");
    } finally {
      isLoading.value = false;
      // 加载完成后才开始监听变化，防止初始赋值触发 isDirty
      watch([slug, tags, status], () => { isDirty.value = true; });
      // TODO: 接入 Markdown 编辑器后，对 title/content 加防抖自动保存：
      // watchDebounced([title, content], save, { debounce: 2000 })
      // 参考：@vueuse/core watchDebounced
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
        savePost(uuid, {
          slug: slug.value || undefined,
          tags: tags.value,
          // TODO: title: title.value || undefined,
          // TODO: content: content.value,
          // TODO: contentMarkdown: contentMarkdown.value || undefined,
          // TODO: contentText: contentText.value || undefined,
          // TODO: excerpt: excerpt.value || undefined,
          // TODO: coverImage: coverImage.value || undefined,
        }),
        updatePostStatus(uuid, status.value),
      ]);
      isDirty.value = false;
      useToast.success("保存成功");
    } catch (e) {
      useToast.error(typeof e === "string" ? e : "保存失败，请重试");
    } finally {
      isSaving.value = false;
    }
  };

  onMounted(loadPost);

  return { uuid, slug, tags, status, isSaving, isLoading, isDirty, save };
};
