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
      // TODO [风险4 - Slug 覆盖]: 加载文章时把后端返回的 slug 直接当作 lastAutoSlug 初始值。
      //   若该 slug 是用户之前手动定制的，修改标题时 `slug === lastAutoSlug` 条件成立，
      //   会把手动 slug 覆盖成新的自动生成值。
      //   修复方向：加载时用一个单独标志 `isSlugCustomized` 记录 slug 是否已被人工编辑过，
      //   若是则跳过标题联动逻辑。
      let lastAutoSlug = slug.value; // 记录上次自动生成的 slug
      watch(title, (newTitle) => {
        if (slug.value === "" || slug.value === lastAutoSlug) {
          lastAutoSlug = limax(newTitle);
          slug.value = lastAutoSlug;
        }
      });
      // TODO [风险3 - 封面不触发自动保存]: coverImage 已经出现在下方的 watchDebounced 监听数组里，
      //   但它不在上面设置 isDirty = true 的 watch 数组 [slug, tags, status, title, content, excerpt, pinned] 中。
      //   若用户只修改封面而不改其他字段，isDirty 保持 false，autoSave 开头的 `if (!isDirty.value) return`
      //   会直接跳过，封面变更不会被自动保存。
      //   修复方向：把 coverImage 加入 isDirty 监听数组，或在 coverImage watch 回调里单独设 isDirty = true。

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
          // TODO [已有注释]: 这里的自动保存监听可能还不完整；例如 status 变更走的是独立发布接口，历史上也可能有其它渐进式新增字段没接进来，需要后面统一复查一次自动保存覆盖面。
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
    // TODO [已有注释]: 这里要补空标题 + 已发布的兜底校验；如果标题为空且状态改成已发布，slug 可能为空，前台文章就会因为找不到可访问地址而无法打开。
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
    // TODO [风险1 - 自动保存竞态]: isSaving 为 true 时直接跳过本轮触发，但旧请求成功返回后会无条件
    //   设置 isDirty = false，而用户在这段时间里做的新修改并未被保存。
    //   修复方向：引入"保存中产生了新脏数据"标志，请求完成后若为 true 则立刻再触发一次保存，
    //   或改用队列/版本号机制确保最后一次修改一定能落盘。
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
      // TODO [风险2 - 手动保存部分成功]: 两个请求通过 Promise.all 并行执行。
      //   若 savePost 成功而 updatePostStatus 失败（或反之），catch 只能捕获整体失败并弹出提示，
      //   但服务端已经产生了部分修改——内容或状态只有一个被更新。
      //   修复方向：改用顺序执行（先内容后状态），或分别 try/catch 并在 UI 上明确提示哪一步失败，
      //   让用户知道需要重试的是哪部分。
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
