// src/composables/post-editor.hook.ts
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute } from "vue-router";
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
  /**
   * 表单版本号：任何字段变更都 +1。
   *
   * 保存请求发出时记下当时的版本，请求回来后再比一次：版本没动，说明这一轮
   * 请求确实覆盖了当前全部内容，可以安心清 isDirty；版本变了，说明用户在
   * 请求飞行途中又改了东西，那些改动并不在这次 payload 里，isDirty 必须留着。
   */
  let formVersion = 0;
  /** 有一次自动保存因为「上一轮还在飞」被跳过了，等这轮落地后要补上 */
  let autoSavePending = false;

  /** 加载已有文章数据并填充表单 */
  const loadPost = async () => {
    isLoading.value = true;
    // 这篇文章是否公开过。决定标题还能不能联动 slug，见下方 watch(title)
    let hasBeenPublished = false;
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
      // 「首次发布才记录 publishedAt，重新发布不覆盖」（post.service.ts updateStatus），
      // 所以发布后又转回草稿的文章这里仍为 true —— 它的 URL 早已被索引过
      hasBeenPublished = post.publishedAt != null;
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
          formVersion += 1;
        },
        { deep: true },
      );
      // 标题变化时自动同步 slug：
      // - 从未公开过 → 继续联动（草稿的地址没人见过，随便改）
      // - 已公开过（publishedAt 非空）→ 锁定，标题再改也不动 slug
      // - 联动途中 slug 被手动改动（不再等于上次自动生成值）→ 停止联动
      //
      // 只锁公开过的，是因为换 slug 等于换前台 URL，代价很实在：RSS 条目的 GUID
      // 就是 slug 拼出来的 URL（feed.service.ts），改一次订阅者就被重复推送一次；
      // 老链接没有任何 301 兜底，sitemap 交给搜索引擎的地址也会一并失效。
      // 草稿没有这些顾虑，不该被连坐。
      let lastAutoSlug = slug.value; // 记录上次自动生成的 slug
      watch(title, (newTitle) => {
        if (hasBeenPublished) return;
        if (slug.value === "" || slug.value === lastAutoSlug) {
          lastAutoSlug = limax(newTitle);
          slug.value = lastAutoSlug;
        }
      });
      // coverImage 刻意不在上面的 isDirty 数组里：它的唯一变更路径是
      // PostEditorCoverSetting 上传成功后直接调 savePost 落库（ImageUpload 只
      // emit change(file)，没有清空入口），封面当场就存下了。再让它触发 isDirty
      // 只会换来一次多余的全量自动保存，外加状态栏闪一下「未保存」。

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
    // 上一轮还在飞：直接丢掉这次触发的话，「改动发生在保存途中 + 之后不再输入」
    // 就没有任何东西会再触发保存了。记个标记，等那轮落地后补一次
    if (isSaving.value) {
      autoSavePending = true;
      return;
    }
    isSaving.value = true;
    // 先取版本号快照，再构造 payload，顺序不能反：反了的话两者之间发生的变更
    // 会被算进这次 payload，却又让版本号显得没动过
    const version = formVersion;
    try {
      await savePost(uuid, buildSavePayload());
      // 版本变了说明请求途中用户又改了，这些改动不在刚才的 payload 里，
      // 不能清 isDirty —— 这正是「保存中的修改被静默丢弃」的根因
      if (formVersion === version) isDirty.value = false;
      else autoSavePending = true;
    } catch (error: any) {
      useToast.error(t(`common.validation.${error}`));
      // 失败了就不补跑：内容仍是脏的，下一次输入的防抖会再来一轮。
      // 在这里重试只会把同一个错误连着弹好几遍
      autoSavePending = false;
    } finally {
      isSaving.value = false;
    }
    if (autoSavePending) {
      autoSavePending = false;
      await autoSave();
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
    // 发布前兜底：前台详情页按 slug 查文章（post.service.ts 的 getBySlug），
    // slug 为空就永远查不到，等于发上去一篇打不开的文章。slug 由标题派生，
    // 标题为空时通常也拿不到 slug；标题只含符号 / emoji 时 limax 同样会返回空串。
    // 后端 updateStatus 只维护状态与时间戳、不做这项校验，所以拦在这里。
    if (status.value === "published" && !slug.value.trim()) {
      useToast.error(t("views.admin.PostEditor.validation.slugRequired"));
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

  // --- 离开保护 ---
  //
  // 自动保存是 2 秒防抖 + 8 秒 maxWait，「刚打完字就切走」这段窗口里内容还在内存里；
  // isSaving 期间请求也可能还没落库。这两种情况下离开页面，内容就没了。
  //
  // 演示模式不拦：写操作必被后端拒绝，autoSave 在源头就 return 了，isDirty 一旦
  // 变 true 再也回不去——不排除的话游客点一下就被弹窗糊脸。
  /** 是否有内容还没落库 */
  const hasUnsaved = () =>
    !authStore.isDemoUser && (isDirty.value || isSaving.value);

  /** 离开确认弹窗的显示状态，由页面组件渲染 ConfirmModal */
  const showLeaveConfirm = ref(false);
  /** 暂存路由守卫的 resolve，等用户在弹窗里做出选择后再放行/拦截 */
  let resolveLeave: ((leave: boolean) => void) | null = null;

  const settleLeave = (leave: boolean) => {
    showLeaveConfirm.value = false;
    resolveLeave?.(leave);
    resolveLeave = null;
  };
  /** 弹窗「确认」：放弃未保存内容，继续跳转 */
  const confirmLeave = () => settleLeave(true);
  /** 弹窗「取消」／关闭：留在当前页 */
  const cancelLeave = () => settleLeave(false);

  // 站内路由跳转：卡住守卫，等弹窗结果
  onBeforeRouteLeave(() => {
    if (!hasUnsaved()) return true;
    showLeaveConfirm.value = true;
    return new Promise<boolean>((resolve) => {
      resolveLeave = resolve;
    });
  });

  // 关闭标签页 / 刷新 / 前进后退出站：只能用浏览器原生确认，
  // 文案由浏览器决定，preventDefault 是现代浏览器唯一还认的触发方式
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!hasUnsaved()) return;
    event.preventDefault();
  };
  onMounted(() => window.addEventListener("beforeunload", handleBeforeUnload));
  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    // 组件已经销毁还挂着未 resolve 的守卫会让路由永远卡住
    resolveLeave?.(true);
    resolveLeave = null;
  });

  onMounted(loadPost);

  return {
    showLeaveConfirm,
    confirmLeave,
    cancelLeave,
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
