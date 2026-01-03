import { createI18n } from "vue-i18n";
import { useStorage } from "@vueuse/core";
import zhCN from "@/locales/zh-CN.json";
import enUS from "@/locales/en-US.json";

// 定义语言包
const LOCALE_CONFIG = {
    "zh-CN": {
        label: "简体中文",
        message: zhCN,
    },
    "en-US": {
        label: "English",
        message: enUS,
    },
} as const;

const messages = Object.fromEntries(
    Object.entries(LOCALE_CONFIG).map(([key, value]) => [key, value.message]),
);

function getBestLocale(messages: Record<string, any>): string {
    const supportedLocales = Object.keys(messages);
    // 获取浏览器语言偏好列表，例如 ["zh-CN", "en-US", "en"]
    // 如果浏览器不支持 navigator.languages，退而求其次使用 navigator.language
    const userLangs = navigator.languages || [navigator.language];

    for (const lang of userLangs) {
        // 1. 尝试精确匹配 (zh-CN)
        if (supportedLocales.includes(lang)) {
            return lang;
        }

        // 2. 尝试模糊匹配 (zh-CN -> zh)
        const shortLang = lang.split("-")[0] || "";
        const fuzzyMatch = supportedLocales.find((item) =>
            item.startsWith(shortLang)
        );
        if (fuzzyMatch) {
            return fuzzyMatch;
        }
    }

    // 3. 最终兜底：如果遍历完所有偏好都没匹配到，返回默认语言
    return "en-US";
}

const localeStorage = useStorage("locale", getBestLocale(messages));

// 创建 i18n 实例
const i18n = createI18n({
    // 为了更好的 TS 支持和 Vue3 特性，通常建议设为 false
    // 这里我们使用 legacy: false 以便更好地配合 Composition API
    legacy: false,

    // 开启全局注入 $t 函数，这样在模板中可以直接使用 $t('key')
    globalInjection: true,

    // 默认语言
    locale: localeStorage.value,

    // 备用语言，当当前语言没有翻译时使用
    fallbackLocale: "en-US",

    messages,
});

export default i18n;

export const setLocale = (lang: LocaleType) => {
    // 1. 修改 i18n 内部状态，触发界面更新
    i18n.global.locale.value = lang;

    // 2. 更新 localStorage
    localeStorage.value = lang;

    // 3. 设置 HTML lang 属性
    document.querySelector("html")?.setAttribute("lang", lang);
};

// 导出语言类型
export type LocaleType = keyof typeof LOCALE_CONFIG;

// 适用于列表渲染
export const SUPPORTED_LOCALES = Object.entries(LOCALE_CONFIG).map((
    [key, value],
) => ({
    label: value.label,
    value: key as LocaleType,
}));
