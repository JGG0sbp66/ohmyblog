import { useDark, useStorage, useToggle } from '@vueuse/core';
import { watch } from 'vue';

// 定义类型
interface ThemeColor {
  name: string;
  // 定义色相角度
  hue: number;
  // 浅色模式的值
  light: { base: string; hover: string; active: string };
  // 深色模式的值
  dark: { base: string; hover: string; active: string };
}

export const themeOptions: ThemeColor[] = [
  {
    name: '蓝色',
    hue: 250,
    light: { base: 'var(--color-blue-600)', hover: 'var(--color-blue-700)', active: 'var(--color-blue-500)' },
    dark: { base: 'var(--color-blue-700)', hover: 'var(--color-blue-600)', active: 'var(--color-blue-800)' }
  },
  {
    name: '绿色',
    hue: 142,
    light: { base: 'var(--color-green-600)', hover: 'var(--color-green-700)', active: 'var(--color-green-500)' },
    dark: { base: 'var(--color-green-700)', hover: 'var(--color-green-600)', active: 'var(--color-green-800)' }
  },
  {
    name: '红色',
    hue: 25,
    light: { base: 'var(--color-red-600)', hover: 'var(--color-red-700)', active: 'var(--color-red-500)' },
    dark: { base: 'var(--color-red-700)', hover: 'var(--color-red-600)', active: 'var(--color-red-800)' }
  },
];


// 当前选中的深浅模式状态
export const isDark = useDark({
  storageKey: 'colorMode',
  disableTransition: false,
});

// 1. 切换深浅模式
export const toggleDarkMode = useToggle(isDark);

// 默认主题颜色
const currentThemeName = useStorage('currentTheme', '蓝色');

function updateCssVariables(themeName: string) {
  const theme = themeOptions.find(t => t.name === themeName);
  if (!theme) return;

  const rootStyle = document.documentElement.style;

  rootStyle.setProperty('--app-hue', theme.hue.toString());

  // 填入浅色插槽
  rootStyle.setProperty('--user-primary-light', theme.light.base);
  rootStyle.setProperty('--user-primary-hover-light', theme.light.hover);
  rootStyle.setProperty('--user-primary-active-light', theme.light.active);

  // 填入深色插槽
  rootStyle.setProperty('--user-primary-dark', theme.dark.base);
  rootStyle.setProperty('--user-primary-hover-dark', theme.dark.hover);
  rootStyle.setProperty('--user-primary-active-dark', theme.dark.active);
}

watch(currentThemeName, (newName) => {
  updateCssVariables(newName);
}, { immediate: true });

// 2. 切换主题颜色
export function changeBrandColor(themeName: string) {
  currentThemeName.value = themeName;
}