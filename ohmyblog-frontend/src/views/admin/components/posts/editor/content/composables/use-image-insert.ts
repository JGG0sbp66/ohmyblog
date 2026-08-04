// src/views/admin/components/posts/editor/content/composables/use-image-insert.ts
import type { Editor } from "@tiptap/core";
import router from "@/router";
import { uploadPostImage } from "@/api/upload.api";
import { UPLOAD_LIMITS } from "@/api/shared";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";
import { checkImageSize } from "@/composables/upload.hook";

/**
 * useImageInsert — 文章插图「上传 + 插入」单一真源
 *
 * 收敛三处入口的图片插入逻辑，避免重复：
 * - Ctrl+V 粘贴（PostEditorBody.handlePaste）
 * - 拖拽文件进编辑器（PostEditorBody.handleDrop）
 * - 菜单图片按钮（handle「常用」/ slash「常用」）
 *
 * uuid 取自全局 router 单例（而非 useRoute 注入）：slash 菜单挂在独立 createApp 上、
 * 没接主应用 router，useRoute() 会注入失败；用 router.currentRoute 则两处都可用。
 * 上传成功后用 setImage 插入到光标处。
 */
export function useImageInsert() {
  const { t } = useLang();

  /** 上传单个图片文件，成功后插入到当前光标位置 */
  const uploadAndInsert = (editor: Editor, file: File) => {
    // 粘贴/拖拽进来的往往是未压缩的原图，先本地拦一道，
    // 避免把几十 MB 传完才被后端拒绝
    if (!checkImageSize(file, UPLOAD_LIMITS.postImage)) return;

    const uuid = router.currentRoute.value.params.uuid as string;
    // TODO [风险6 - 图片插入位置]: uploadPostImage 是异步的，但这里没有在上传开始时记录光标位置
    //   （editor.state.selection 的快照）。上传期间用户移动光标或继续编辑后，
    //   图片会通过 editor.chain().focus().setImage() 插入到新的光标位置，而非粘贴/拖拽时所在的位置。
    //   修复方向：在调用 uploadPostImage 之前，通过 insertContentAt 配合提前捕获的位置（pos）插入，
    //   或先在光标处插入一个占位节点，上传完成后替换。
    uploadPostImage(uuid, { image: file })
      .then((result) => {
        if (!result?.url) return;
        editor.chain().focus().setImage({ src: result.url }).run();
      })
      .catch((e: unknown) => {
        const msg = typeof e === "string" ? e : (e as any)?.message || "Error";
        useToast.error(t(`api.errors.${msg}`));
      });
  };

  /** 弹出文件选择框，选图后走 uploadAndInsert（菜单按钮用） */
  const pickAndInsert = (editor: Editor) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) uploadAndInsert(editor, file);
    };
    input.click();
  };

  return { uploadAndInsert, pickAndInsert };
}
