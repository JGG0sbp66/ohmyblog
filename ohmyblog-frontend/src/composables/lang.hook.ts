// src/composables/lang.hook.ts
import { createI18n } from "vue-i18n";
import { useStorage } from "@vueuse/core";
import type { Ref } from "vue";
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

/**
 * 语言自适应检测
 * 策略：
 * 1. 尝试精确匹配浏览器语言列表 (如 zh-CN)
 * 2. 尝试模糊匹配语言前缀 (如 zh-TW -> zh)
 * 3. 最终兜底使用英文 (en-US)
 */
function getBestLocale(): LocaleType {
  const supported = Object.keys(messages);
  // 获取浏览器语言偏好列表，例如 ["zh-CN", "en-US", "en"]
  const userLangs = navigator.languages || [navigator.language];

  for (const lang of userLangs) {
    // 1. 尝试精确匹配
    if (supported.includes(lang)) return lang as LocaleType;

    // 2. 尝试模糊匹配 (取前缀，如 'zh-HK' -> 'zh')
    const short = lang.split("-")[0] || "";
    const fuzzy = supported.find((item) => item.startsWith(short));
    if (fuzzy) return fuzzy as LocaleType;
  }

  // 3. 最终兜底
  return "en-US";
}

const localeStorage = useStorage<LocaleType>("locale", getBestLocale());

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

/**
 * 核心 Composable：统一管理语言状态与方法
 */
export function useLang() {
  const instance = i18n.global;

  const setLocale = (lang: LocaleType) => {
    instance.locale.value = lang;
    localeStorage.value = lang;
    document.documentElement.setAttribute("lang", lang);
  };

  return {
    /**
     * 包装原生的 t 函数，增加对后端原始错误消息的特殊处理
     * 目的是绕过 vue-i18n 对包含 "." 的 key 进行路径解析的问题
     */
    t: (key: string, ...args: any[]) => {
      // 针对 api.errors 路径下的翻译进行拦截
      if (key.startsWith("api.errors.")) {
        const errorKey = key.replace("api.errors.", "");
        // 使用 tm (message manager) 获取 errors 对象
        const errors = instance.tm("api.errors") as Record<string, any>;
        
        // 直接使用属性名称查找，这样可以匹配包含 "." 或 "\"" 的原始字符串键
        if (errors && errors[errorKey]) {
          return instance.rt(errors[errorKey]);
        }
      }
      // 兜底使用原生翻译逻辑
      // 使用扩展运算符透传，确保不破坏原生的参数结构（如插值对象 {count} 等）
      return (instance.t as any)(key, ...args);
    },
    locale: instance.locale as Ref<LocaleType>,
    setLocale,
    SUPPORTED_LOCALES,
  };
}

// 导出类型与常量
export type LocaleType = keyof typeof LOCALE_CONFIG;
export const SUPPORTED_LOCALES = Object.entries(LOCALE_CONFIG).map(
  ([key, value]) => ({
    label: value.label,
    value: key as LocaleType,
  }),
);
