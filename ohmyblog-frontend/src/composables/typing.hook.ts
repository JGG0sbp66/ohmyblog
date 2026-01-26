// src/composables/typing.hook.ts
import { type Ref, ref, unref, watch } from "vue";

/**
 * 打字机效果 Hook
 * @param speed 打字速度 (ms)
 */
export function useTyping(speed = 50) {
  const displayText = ref("");
  const isTyping = ref(false);
  let currentAnimationId = 0;

  /**
   * 执行打字动画
   * @param text 要显示的完整文本
   * @param delay 延迟开始时间 (ms)
   */
  const type = (text: string | undefined, delay = 0) => {
    // 每次调用 type，生成一个新的 ID
    const id = ++currentAnimationId;

    return new Promise<void>((resolve) => {
      // 立即停止并重置当前状态
      const stopAndResolve = () => {
        isTyping.value = false;
        resolve();
      };

      if (!text) {
        displayText.value = "";
        stopAndResolve();
        return;
      }

      // 1. 处理延迟逻辑
      setTimeout(() => {
        // 如果在延迟期间，ID 已经变了，说明该动画已被废弃
        if (id !== currentAnimationId) {
          resolve(); // 直接结束，不设置 isTyping
          return;
        }

        // 2. 正式开始打字
        isTyping.value = true;
        displayText.value = "";
        let index = 0;

        const interval = setInterval(() => {
          // 每一帧都检查 ID，确保动画是当前最新的
          if (id !== currentAnimationId) {
            clearInterval(interval);
            resolve();
            return;
          }

          if (index < text.length) {
            displayText.value += text[index];
            index++;
          } else {
            // 打字完成
            clearInterval(interval);
            isTyping.value = false;
            resolve();
          }
        }, speed);
      }, delay);
    });
  };

  /**
   * 重置文本
   */
  const reset = () => {
    currentAnimationId++;
    displayText.value = "";
    isTyping.value = false;
  };

  return {
    displayText,
    isTyping,
    type,
    reset,
  };
}
