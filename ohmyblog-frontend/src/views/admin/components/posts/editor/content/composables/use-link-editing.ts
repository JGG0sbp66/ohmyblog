// src/views/admin/components/posts/editor/content/composables/use-link-editing.ts
import { computed, ref } from "vue";
import type { Editor } from "@tiptap/core";

/**
 * useLinkEditing — 链接的「插入 / 编辑 / 移除」三态机（单一真源）
 *
 * 桌面端气泡菜单（BubbleLinkButton）与移动端工具条（MobileLinkButton）共用。
 *
 * 为什么只抽逻辑、两端各留一份模板：两者的**布局约束**是真的不同 ——
 * 桌面那份包在 IconTipButton → BaseTooltip 里、弹层朝下开；移动端不能有 hover
 * 提示（触屏点一下就永久挂着），按钮要走「定尺寸容器 + h-full/w-full」才不会被
 * ButtonSecondary 的 min-h-full 抻成长方形，弹层还必须朝上开否则落到视口外。
 * 但这些差异全在模板里，状态与命令逐字相同，各写一份迟早漂移
 * （事实上已经开始了：一份给输入框加了 type="url"，另一份没有）。
 */
export function useLinkEditing(getEditor: () => Editor) {
  const isOpen = ref(false);
  const linkUrl = ref("");
  /** 弹窗打开时记录的原始 URL，用于判断用户是否修改过 */
  const originalUrl = ref("");
  /** 弹窗打开时链接是否已存在 */
  const isLinkActive = ref(false);

  /**
   * 移除模式：链接已存在 且 URL 未被手动修改
   * - true  → 操作按钮显示「移除链接」（红色）
   * - false → 显示「插入」（主题色）
   */
  const isRemoveMode = computed(
    () => isLinkActive.value && linkUrl.value === originalUrl.value,
  );

  /** 点触发按钮：开则关，关则以当前链接状态初始化后打开 */
  const toggle = () => {
    const editor = getEditor();
    isLinkActive.value = editor.isActive("link");
    originalUrl.value = editor.getAttributes("link").href ?? "";
    linkUrl.value = originalUrl.value;
    isOpen.value = !isOpen.value;
  };

  /** 按当前模式落地：移除 / 设置链接，然后关闭弹层 */
  const apply = () => {
    const editor = getEditor();
    if (isRemoveMode.value) {
      editor.chain().focus().unsetLink().run();
    } else if (linkUrl.value) {
      editor.chain().focus().setLink({ href: linkUrl.value }).run();
    }
    isOpen.value = false;
  };

  return { isOpen, linkUrl, isRemoveMode, toggle, apply };
}
