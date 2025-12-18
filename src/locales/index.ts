import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

// 定义语言包
const messages = {
    'zh-CN': zhCN,
    'en-US': enUS,
}

// 创建 i18n 实例
// TODO: 1. 实现将语言存入 localStorage 并在初始化时读取
// TODO: 2. 实现根据浏览器语言自动读取默认语言
// TODO: 3. 将ts语言库修改为json格式
const i18n = createI18n({
    // 为了更好的 TS 支持和 Vue3 特性，通常建议设为 false
    // 这里我们使用 legacy: false 以便更好地配合 Composition API
    legacy: false,

    // 开启全局注入 $t 函数，这样在模板中可以直接使用 $t('key')
    globalInjection: true,

    // 默认语言
    locale: 'zh-CN',

    // 备用语言，当当前语言没有翻译时使用
    fallbackLocale: 'en-US',

    messages,
})

export default i18n

