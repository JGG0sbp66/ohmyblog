import { useColorMode, useStorage } from '@vueuse/core';
import { watch, computed } from 'vue';

// 当前选中的深浅模式状态
export const colorMode = useColorMode({
  storageKey: 'colorMode',
  // 这里的 modes 可以自定义，但默认支持 auto/light/dark
  modes: {
    light: '', // light 模式下不加 class
    dark: 'dark', // dark 模式下 html 标签加 'dark' class
    auto: 'auto', // auto 模式
  },
  // 当为 auto 时，会自动根据系统偏好设置 light 或 dark class
  emitAuto: true,
  disableTransition: false,
});

// 是否为深色模式
export const isDark = computed(() => colorMode.value === 'dark' || (colorMode.value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches));

export function cycleTheme() {
  const modes = ['light', 'dark', 'auto'] as const;
  const currentIndex = modes.indexOf(colorMode.value as any);
  const nextIndex = (currentIndex + 1) % modes.length;
  colorMode.value = modes[nextIndex]!;
}

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
