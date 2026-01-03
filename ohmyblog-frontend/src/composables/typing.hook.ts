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
        return new Promise<void>((resolve) => {
            const id = ++currentAnimationId;

            // 立即进入打字状态（显示光标）
            isTyping.value = true;

            if (!text) {
                displayText.value = "";
                isTyping.value = false;
                resolve();
                return;
            }

            setTimeout(() => {
                if (id !== currentAnimationId) {
                    resolve();
                    return;
                }

                let index = 0;
                displayText.value = "";

                const interval = setInterval(() => {
                    if (id !== currentAnimationId) {
                        clearInterval(interval);
                        isTyping.value = false;
                        resolve();
                        return;
                    }

                    if (index < text.length) {
                        displayText.value += text[index];
                        index++;
                    } else {
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
