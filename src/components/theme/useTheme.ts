import { ref } from 'vue';

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
    dark:  { base: 'var(--color-blue-700)', hover: 'var(--color-blue-600)', active: 'var(--color-blue-800)' }
  },
  { 
    name: '绿色',
    hue: 142,
    light: { base: 'var(--color-green-600)', hover: 'var(--color-green-700)', active: 'var(--color-green-500)' },
    dark:  { base: 'var(--color-green-700)', hover: 'var(--color-green-600)', active: 'var(--color-green-800)' }
  },
  { 
    name: '红色',
    hue: 25,
    light: { base: 'var(--color-red-600)', hover: 'var(--color-red-700)', active: 'var(--color-red-500)' },
    dark:  { base: 'var(--color-red-700)', hover: 'var(--color-red-600)', active: 'var(--color-red-800)' }
  },
];


// 当前选中的深浅模式状态
export const isDark = ref(false);

// 切换深浅模式
export function toggleDarkMode() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('colorMode', 'light');
        isDark.value = false;
    } else {
        html.classList.add('dark');
        localStorage.setItem('colorMode', 'dark');
        isDark.value = true;
    }
}

// 切换颜色
export function changeBrandColor(themeName: string) {
    const theme = themeOptions.find(t => t.name === themeName);
    if (!theme) return;

    const rootStyle = document.documentElement.style;

    // 0. 设置色相
    rootStyle.setProperty('--app-hue', theme.hue.toString());

    // 1. 填入浅色插槽 (Light Slot)
    rootStyle.setProperty('--user-primary-light', theme.light.base);
    rootStyle.setProperty('--user-primary-hover-light', theme.light.hover);
    rootStyle.setProperty('--user-primary-active-light', theme.light.active);

    // 2. 填入深色插槽 (Dark Slot)
    rootStyle.setProperty('--user-primary-dark', theme.dark.base);
    rootStyle.setProperty('--user-primary-hover-dark', theme.dark.hover);
    rootStyle.setProperty('--user-primary-active-dark', theme.dark.active);

    localStorage.setItem('currentTheme', theme.name);
}

// 初始化函数
export function initTheme() {
    // 1. 恢复深浅
    const savedMode = localStorage.getItem('colorMode');
    if (savedMode === 'dark' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        isDark.value = true;
    }

    // 2. 恢复颜色
    const savedTheme = localStorage.getItem('currentTheme');
    changeBrandColor(savedTheme || '蓝色');
}