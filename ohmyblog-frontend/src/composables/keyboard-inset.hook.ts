// src/composables/keyboard-inset.hook.ts
import { onBeforeUnmount, onMounted, ref } from "vue";

/**
 * useKeyboardInset — 虚拟键盘的位置信息
 *
 * 浏览器处理键盘有两种模型：
 *
 * 【A】resizes-content —— 键盘压缩 layout viewport
 *   本项目在 index.html 里声明了 `interactive-widget=resizes-content`，
 *   Chromium 108+ 走这条路。页面自己变矮，`position: fixed; bottom: 0`
 *   落点天然就在键盘上沿，不需要任何补偿 → inset 恒为 0。
 *
 * 【B】resizes-visual —— 键盘盖在页面上
 *   iOS Safari 目前只有这个模型（不认 interactive-widget）。layout viewport
 *   不变，fixed 元素的 bottom 仍锚在页面底部、也就是键盘背面，必须自己让开：
 *     inset = innerHeight - (visualViewport.height + visualViewport.offsetTop)
 *
 * 只导出这两样：一个让位距离，一个「键盘在不在」。
 *
 * ⚠️ 刻意不导出键盘高度。曾经试过用 innerHeight 的收缩量反推它、再拿去做补偿定位，
 * 结果是灾难：地址栏收放同样会改 innerHeight，基线一旦记到「地址栏隐藏」时的大值，
 * 收缩量就长期非零，吸附元件跟着噪声乱飘。凡是需要「键盘占了多高」的场景，都应该
 * 改成让布局自己去吃掉那块空间（例如同时钉 top 与 bottom，中间用 flex-1 填充），
 * 而不是预测一个数值。
 */

/**
 * 小于该值一律视作没有键盘。
 * 地址栏收放、橡皮筋回弹、手势条都会在 0 附近抖出几十 px。
 */
const NOISE_THRESHOLD_PX = 40;

export function useKeyboardInset() {
  /** 模型 B 下键盘遮住的高度；模型 A 下恒为 0 */
  const inset = ref(0);
  /** 键盘当前是否弹出 */
  const keyboardOpen = ref(false);

  /** 键盘收起时的 layout viewport 高度基线，仅用于模型 A 判断「键盘在不在」 */
  let baseHeight = 0;
  /** 基线所属的视口宽度；转屏后高度基线失效，靠宽度变化识别 */
  let baseWidth = 0;

  const measure = () => {
    const vv = window.visualViewport;
    if (!vv) return;

    if (window.innerWidth !== baseWidth) {
      baseWidth = window.innerWidth;
      baseHeight = 0;
    }

    // 模型 B：visual viewport 被键盘压小，layout viewport 不变
    const overlay = window.innerHeight - vv.height - vv.offsetTop;
    inset.value = overlay > NOISE_THRESHOLD_PX ? Math.round(overlay) : 0;

    // 模型 A：layout viewport 自己变矮。这里只用它得出布尔值，不参与定位计算，
    // 所以基线被地址栏污染最多影响判定时机，不会让元件抖动。
    baseHeight = Math.max(baseHeight, window.innerHeight);
    const shrink = baseHeight - window.innerHeight;

    keyboardOpen.value = Math.max(inset.value, shrink) > NOISE_THRESHOLD_PX;
  };

  onMounted(() => {
    if (!window.visualViewport) return;
    measure();
    // resize：键盘弹出 / 收起。
    // scroll：iOS 上页面被键盘顶起时只有 offsetTop 变化、height 不变，
    //         不听这个事件的话工具条会在滚动过程中脱离键盘上沿。
    window.visualViewport.addEventListener("resize", measure);
    window.visualViewport.addEventListener("scroll", measure);
    // 模型 A 下变的是 layout viewport，那是 window 的 resize 而非 vv 的
    window.addEventListener("resize", measure);
  });

  onBeforeUnmount(() => {
    window.visualViewport?.removeEventListener("resize", measure);
    window.visualViewport?.removeEventListener("scroll", measure);
    window.removeEventListener("resize", measure);
  });

  return { inset, keyboardOpen };
}
