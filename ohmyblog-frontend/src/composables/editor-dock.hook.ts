// src/composables/editor-dock.hook.ts
import { ref } from "vue";

/**
 * 移动端编辑器底部浮层（键盘工具条 + 插入面板）实际占据的高度（px，模块级单例）
 *
 * 写入方：MobileEditorToolbar（用 ResizeObserver 实测自身）
 * 读取方：PostEditorContent（换算成正文滚动容器的底部留白）
 *
 * 为什么必须留这段白，而不是不管：
 *
 * 浮层是 position:fixed，不占文档流。而 index.html 声明了
 * `interactive-widget=resizes-content`，键盘收起时 layout viewport 会长回来，
 * 滚动容器的 clientHeight 随之增大，maxScroll = scrollHeight - clientHeight 缩小；
 * 文档只要不够长，scrollTop 就被浏览器直接夹到 0 —— 表现就是「一点加号，
 * 页面跳回文章开头」。
 *
 * 让正文底部留出与浮层等高的空白，两个变化正好抵消：
 *   容器长高 K，同时留白增加 K → scrollHeight 也 +K → maxScroll 不变 → scrollTop 不动。
 * 顺带也解决了「最后几行藏在浮层背后滚不上来」。
 *
 * 高度是**实测**而非预测的：浮层此刻就在 DOM 里，量它比去猜键盘多高可靠得多
 * （猜键盘高度的教训见 keyboard-inset.hook 的注释）。
 */
const dockHeight = ref(0);

export function useEditorDock() {
  return {
    dockHeight,
    /** 浮层上报自身高度；隐藏 / 卸载时报 0 */
    setDockHeight: (px: number) => {
      dockHeight.value = Math.max(0, Math.round(px));
    },
  };
}
