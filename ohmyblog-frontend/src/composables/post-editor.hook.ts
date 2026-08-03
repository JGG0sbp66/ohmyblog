// src/composables/post-editor.hook.ts
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { watchDebounced } from "@vueuse/core";
import limax from "limax";
import type { TPostStatus } from "@server/db/constants/post.constants";
import { getPostById, savePost, updatePostStatus } from "@/api/post.api";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";
import { useAuthStore } from "@/stores/auth.store";

/**
 * 演示模式下"新建文章"用的虚拟草稿 uuid。
 *
 * 后端不存在这条记录：演示访客点新建时不调创建接口（会被 403 拦掉），
 * 直接带着这个 uuid 进编辑器，拿到一个可以随便试的空白编辑器。
 * 含连字符，而真实 uuid 是 cuid2（纯小写字母数字），不会撞。
 */
export const DEMO_DRAFT_UUID = "demo-draft";

/**
 * usePostEditor — 文章编辑器状态 & 保存逻辑
 *
 * 职责：
 * - 从路由参数 uuid 加载已有文章数据，初始化表单
 * - 持有编辑器各字段的响应式状态（slug、title、tags、status、content、coverImage、excerpt 等）
 * - 提供 save() 方法：并行调用 savePost + updatePostStatus
 *
 * 用法：在 PostEditor.page.vue 中调用，通过 v-model 传递给子组件
 */
export const usePostEditor = () => {
  const route = useRoute();
  const uuid = route.params.uuid as string;
  const { t } = useLang();
  const authStore = useAuthStore();

  // --- 表单状态 ---
  const slug = ref("");
  const tags = ref<string[]>([]);
  const status = ref<TPostStatus>("draft");
  const title = ref("");
  const content = ref<object | undefined>(undefined);
  const contentText = ref("");
  const contentHtml = ref("");
  const coverImage = ref<string | null>(null);
  const excerpt = ref("");
  /** 是否置顶（布尔；后端把它翻译成 pinnedAt 时间戳） */
  const pinned = ref(false);

  // --- UI 状态 ---
  const isSaving = ref(false);
  const isLoading = ref(false);
  /** 是否有未保存的更改 */
  const isDirty = ref(false);

  /** 加载已有文章数据并填充表单 */
  const loadPost = async () => {
    isLoading.value = true;
    try {
      // 演示模式的虚拟草稿：后端没有这条记录，跳过加载直接给空白编辑器。
      // 这里 return 不影响 finally 里的 watcher 装配
      if (uuid === DEMO_DRAFT_UUID) return;

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
      // 时间戳 → 布尔：非空即置顶。转换边界只此一处，表单层只跟布尔打交道
      pinned.value = post.pinnedAt != null;
    } catch {
      useToast.error("加载文章失败");
    } finally {
      isLoading.value = false;
      // 加载完成后才开始监听变化，防止初始赋值触发 isDirty
      // deep: true — 捕获 tags 数组的 push/splice 就地变更（浅监听感知不到引用未变的数组修改）
      watch(
        [slug, tags, status, title, content, excerpt, pinned],
        () => {
          isDirty.value = true;
        },
        { deep: true },
      );
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
        [
          title,
          content,
          contentText,
          contentHtml,
          coverImage,
          excerpt,
          tags,
          slug,
          pinned,
        ],
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
    contentText: contentText.value || undefined,
    contentHtml: contentHtml.value || undefined,
    coverImage: coverImage.value ?? undefined,
    excerpt: excerpt.value || undefined,
    pinned: pinned.value,
  });

  const autoSave = async () => {
    // 演示模式：写操作必被后端拒绝，而防抖自动保存每 2 秒就会触发一次，
    // 不在源头拦住的话游客一打字就会持续弹错。静默跳过，不打扰阅读
    if (authStore.isDemoUser) return;
    if (isSaving.value) return;
    isSaving.value = true;
    try {
      await savePost(uuid, buildSavePayload());
      isDirty.value = false;
    } catch (error: any) {
      useToast.error(t(`common.validation.${error}`));
    } finally {
      isSaving.value = false;
    }
  };

  /**
   * 保存文章
   *
   * 分两步并行执行：
   * 1. savePost() — 保存内容字段（slug、title、tags、content、coverImage、excerpt 等）
   * 2. updatePostStatus() — 更新文章状态（独立接口）
   */
  const save = async () => {
    // 演示模式：这是用户主动点的按钮，给一次明确反馈再返回。
    // 用 error 等级与其他写操作被后端 403 拦下时的提示保持一致
    if (authStore.isDemoUser) {
      useToast.error(t("api.errors.演示模式下不可修改数据"));
      return;
    }
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
      useToast.error(t(`common.validation.${error}`));
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
    contentText,
    contentHtml,
    coverImage,
    excerpt,
    pinned,
    isSaving,
    isLoading,
    isDirty,
    save,
  };
};
