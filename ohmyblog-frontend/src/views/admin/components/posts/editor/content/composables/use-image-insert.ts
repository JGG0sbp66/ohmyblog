// src/views/admin/components/posts/editor/content/composables/use-image-insert.ts
import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
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

    // 上传是异步的，等 URL 回来时光标多半已经不在原处了（用户继续打字、点了别处）。
    // 所以在这里就把「粘贴/拖拽发生的位置」定下来，并让它跟着后续每一笔编辑一起
    // 位移——Tiptap 的 MappablePosition 就是干这个的，transaction 里 map 一次即可。
    let target = editor.utils.createMappablePosition(
      editor.state.selection.from,
    );
    /** 目标位置是否已被后续编辑删掉（比如用户选中这段全删了） */
    let dropped = false;
    const track = ({ transaction }: { transaction: Transaction }) => {
      const { position, mapResult } = editor.utils.getUpdatedPosition(
        target,
        transaction,
      );
      target = position;
      if (mapResult?.deleted) dropped = true;
    };
    editor.on("transaction", track);
    const stopTracking = () => editor.off("transaction", track);

    uploadPostImage(uuid, { image: file })
      .then((result) => {
        stopTracking();
        if (!result?.url) return;
        // 原位置被删了就退回当前光标，总比把图片插进一个不存在的位置强
        const pos = dropped ? editor.state.selection.from : target.position;
        // 不带 focus()：上传期间用户可能已经在别处输入，把焦点抢回插入点会打断他
        editor
          .chain()
          .insertContentAt(pos, { type: "image", attrs: { src: result.url } })
          .run();
      })
      .catch((e: unknown) => {
        stopTracking();
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
