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
    light: { base: 'blue-600', hover: 'blue-700', active: 'blue-500' },
    dark:  { base: 'blue-700', hover: 'blue-600', active: 'blue-800' }
  },
  { 
    name: '绿色',
    hue: 142,
    light: { base: 'green-600', hover: 'green-700', active: 'green-500' },
    dark:  { base: 'green-700', hover: 'green-600', active: 'green-800' }
  },
  { 
    name: '红色',
    hue: 25,
    light: { base: 'red-600', hover: 'red-700', active: 'red-500' },
    dark:  { base: 'red-700', hover: 'red-600', active: 'red-800' }
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
    rootStyle.setProperty('--user-primary-light', `var(--color-${theme.light.base})`);
    rootStyle.setProperty('--user-primary-hover-light', `var(--color-${theme.light.hover})`);
    rootStyle.setProperty('--user-primary-active-light', `var(--color-${theme.light.active})`);

    // 2. 填入深色插槽 (Dark Slot)
    rootStyle.setProperty('--user-primary-dark', `var(--color-${theme.dark.base})`);
    rootStyle.setProperty('--user-primary-hover-dark', `var(--color-${theme.dark.hover})`);
    rootStyle.setProperty('--user-primary-active-dark', `var(--color-${theme.dark.active})`);

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