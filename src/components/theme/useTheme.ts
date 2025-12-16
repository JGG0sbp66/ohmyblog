import { useDark, useStorage, useToggle } from '@vueuse/core';
import { watch } from 'vue';

// 定义类型
interface ThemeColor {
  name: string;
  // 仅用于 UI 展示的预览色
  previewColor: string;
}

export const themeOptions: ThemeColor[] = [
  {
    name: '蓝色',
    previewColor: 'bg-blue-600',
  },
  {
    name: '绿色',
    previewColor: 'bg-green-600',
  },
  {
    name: '红色',
    previewColor: 'bg-red-600',
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
export const DEFAULT_THEME_NAME = '蓝色';
const currentThemeName = useStorage('currentTheme', DEFAULT_THEME_NAME);

function updateThemeAttribute(themeName: string) {
  // 设置 data-theme 属性，让 CSS 负责具体变量
  document.documentElement.setAttribute('data-theme', themeName);
}

watch(currentThemeName, (newName) => {
  updateThemeAttribute(newName);
}, { immediate: true });

// 2. 切换主题颜色
export function changeBrandColor(themeName: string) {
  currentThemeName.value = themeName;
}
