// src/composables/theme.hook.ts
import { useColorMode, useCssVar, useStorage } from "@vueuse/core";
import { computed, watch } from "vue";
import { getConfig } from "@/api/config.api";

/**
 * 主题配置常量存储键名
 */
const STORAGE_KEYS = {
  THEME: "colorMode", // 存储主题模式 (light/dark/auto)
  HUE: "app-hue", // 存储主题色相 (0-360)
} as const;

/**
 * 支持的主题模式：
 * - light: 浅色模式
 * - dark: 深色模式
 * - auto: 跟随系统设置
 */
export const THEME_MODES = ["light", "dark", "auto"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

/**
 * 默认视觉配置
 */
export const DEFAULT_HUE = 250; // 默认品牌色相 (蓝色)

// --- 状态管理 (单例模式，确保应用全局状态统一) ---

/**
 * 当前选中的深浅模式状态
 * 使用 VueUse 的 useColorMode 自动处理：
 * 1. 本地存储 (LocalStorage) 的读取与同步
 * 2. <html> 标签上的 .dark 类名切换
 * 3. 当设置为 'auto' 时，自动监听系统的 prefers-color-scheme
 */
const colorMode = useColorMode<ThemeMode>({
  storageKey: STORAGE_KEYS.THEME,
  initialValue: "auto",
  emitAuto: true,
  disableTransition: false,
});

/**
 * 响应式存储当前的色相 (Hue) 值
 * 使用 useStorage 自动持久化到本地
 * writeDefaults: false 确保初始化时，如果 localStorage 已有值，不会被初始值覆盖
 */
const hueStore = useStorage<number>(STORAGE_KEYS.HUE, DEFAULT_HUE, undefined, {
  writeDefaults: false,
});

/**
 * CSS 变量绑定
 * 使用 useCssVar 直接将响应式变量映射到 document.documentElement 的 --app-hue
 * 这样修改 hueStore 的值，页面上所有引用该变量的组件都会自动更新颜色
 */
const cssHue = useCssVar("--app-hue", document.documentElement);

/**
 * 全局监听：实时同步 hueStore 的值到 CSS 变量
 * 确保无论是通过 setBrandHue 方法更新，还是通过 v-model 直接操作 hueStore，
 * 都能实时触发 CSS 变量的重绘。
 */
watch(
  hueStore,
  (val) => {
    cssHue.value = String(val);
  },
  { immediate: true },
);

/**
 * 主题管理 Hook
 * 为组件提供统一的主题控制接口
 */
export function useTheme() {
  /**
   * 是否处于深色模式 (计算属性)
   * 逻辑：明确为 'dark'，或者为 'auto' 且系统当前偏好为深色
   */
  const isDark = computed(
    () =>
      colorMode.value === "dark" ||
      (colorMode.value === "auto" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches),
  );

  /**
   * 设置主题模式
   * @param mode 主题模式 (light | dark | auto)
   */
  const setTheme = (mode: ThemeMode) => {
    // 临时禁用文字颜色过渡，避免深浅模式切换时的黑白闪烁
    // 但保留背景色、边框等的过渡效果
    document.documentElement.classList.add('no-color-transition');
    colorMode.value = mode;
    
    // 等待 DOM 更新后，移除禁用类
    setTimeout(() => {
      document.documentElement.classList.remove('no-color-transition');
    }, 50);
  };

  /**
   * 循环切换主题模式
   * 顺序：light -> dark -> auto -> light
   */
  const cycleTheme = () => {
    const currentIndex = THEME_MODES.indexOf(colorMode.value);
    const nextIndex = (currentIndex + 1) % THEME_MODES.length;
    // 使用非空断言，因为索引计算保证了值一定存在
    setTheme(THEME_MODES[nextIndex]!);
  };

  /**
   * 更新品牌主色相
   * @param val 色相值 (0-360)
   */
  const setBrandHue = (val: number) => {
    hueStore.value = val;
  };

  /**
   * 初始化主题配置：尝试从服务器拉取管理员预设的外观设置
   *
   * 策略：
   * 1. 优先尊重用户在本地存储的选择。
   * 2. 如果用户从未手动设置过 (localStorage 键为空)，则请求后台接口。
   * 3. 获取成功后，同步更新本地状态。
   */
  const initThemeConfig = async () => {
    // 检查本地是否存在用户自定义设置
    const hasLocalHue = localStorage.getItem(STORAGE_KEYS.HUE) !== null;
    if (hasLocalHue) {
      return;
    }

    try {
      const res = await getConfig("appearance");
      // 后端返回的配置通常解构自 res.config.configValue
      // 此处通过类型断言解决 {} 类型上不存在属性的问题
      const configValue = res?.config?.configValue as
        | { hue?: number }
        | undefined;
      const remoteHue = configValue?.hue;
      if (typeof remoteHue === "number") {
        setBrandHue(remoteHue);
      }
    } catch (error) {
      // 仅打印错误，不影响应用正常运行（将使用本地默认值）
      console.error("[Theme] 同步服务器外观配置失败:", error);
    }
  };

  return {
    // 响应式状态
    colorMode,
    currentHue: hueStore,
    isDark,

    // 方法
    setTheme,
    cycleTheme,
    setBrandHue,
    initThemeConfig,

    // 常量
    THEME_MODES,
    DEFAULT_HUE,
  };
}
