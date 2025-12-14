<script lang="ts" setup>
import { onMounted } from 'vue';

const themeOptons = [
    { name: '蓝色', primary: 'blue-600', hover: 'blue-700', active: 'blue-500', _safelist: 'bg-blue-600 bg-blue-700 bg-blue-500'},
    { name: '绿色', primary: 'green-600', hover: 'green-700', active: 'green-500', _safelist: 'bg-green-600 bg-green-700 bg-green-500'},
    { name: '红色', primary: 'red-600', hover: 'red-700', active: 'red-500', _safelist: 'bg-red-600 bg-red-700 bg-red-500'},
    { name: '紫色', primary: 'purple-600', hover: 'purple-700', active: 'purple-500', _safelist: 'bg-purple-600 bg-purple-700 bg-purple-500'},
    { name: '橙色', primary: 'orange-600', hover: 'orange-700', active: 'orange-500', _safelist: 'bg-orange-600 bg-orange-700 bg-orange-500'},
    { name: '粉色', primary: 'pink-600', hover: 'pink-700', active: 'pink-500', _safelist: 'bg-pink-600 bg-pink-700 bg-pink-500'},
    { name: '青色', primary: 'teal-600', hover: 'teal-700', active: 'teal-500', _safelist: 'bg-teal-600 bg-teal-700 bg-teal-500'},
    { name: '黄色', primary: 'yellow-600', hover: 'yellow-700', active: 'yellow-500', _safelist: 'bg-yellow-600 bg-yellow-700 bg-yellow-500'},
    { name: '灰色', primary: 'gray-600', hover: 'gray-700', active: 'gray-500', _safelist: 'bg-gray-600 bg-gray-700 bg-gray-500'},
];

const changeTheme = (theme: { name: string, primary: string, hover: string, active: string }) => {
    document.documentElement.style.setProperty('--color-primary', `var(--color-${theme.primary})`);
    document.documentElement.style.setProperty('--color-primary-hover', `var(--color-${theme.hover})`);
    document.documentElement.style.setProperty('--color-primary-active', `var(--color-${theme.active})`);
    localStorage.setItem('currentTheme', theme.name);
}

onMounted(() => {
    const saved = localStorage.getItem('currentTheme');
    if (saved) {
        const theme = themeOptons.find(t => t.name === saved);
        if (theme) {
            changeTheme(theme);
        }
    }
});
</script>

<template>
    <div class="flex gap-4 p-4">
        <button v-for="item in themeOptons" :key="item.name" @click="changeTheme(item)"
            class="flex flex-col items-center gap-2 group">
            <!-- 颜色预览球 -->
            <div class="w-10 h-10 rounded-full shadow-md transition-transform group-hover:scale-110 border-2 border-white ring-2 ring-gray-200"
                :style="{ backgroundColor: `var(--color-${item.primary})` }"></div>
            <span class="text-xs text-gray-600">{{ item.name }}</span>
        </button>
    </div>
</template>