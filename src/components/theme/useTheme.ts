import { useDark, useStorage, useToggle } from '@vueuse/core';
import { watch } from 'vue';

// 当前选中的深浅模式状态
export const isDark = useDark({
  storageKey: 'colorMode',
  // 允许主题切换过渡（具体过渡范围由全局 CSS 控制）
  disableTransition: false,
});

export const toggleDarkMode = useToggle(isDark);

// 默认色相 (蓝色)
export const DEFAULT_HUE = 250;

// 存储当前的 hue 值
export const currentHue = useStorage<number>('app-hue', DEFAULT_HUE);

// 监听 hue 变化，实时设置 CSS 变量
watch(currentHue, (hue) => {
  document.documentElement.style.setProperty('--app-hue', hue.toString());
}, { immediate: true });

// 切换主题色相
export function setBrandHue(hue: number) {
  currentHue.value = hue;
}
