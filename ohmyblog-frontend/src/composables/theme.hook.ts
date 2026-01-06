// src/composables/theme.hook.ts
import { useColorMode, useStorage } from "@vueuse/core";
import { computed, watch } from "vue";
import { getConfig } from "@/api/config.api";

const STORAGE_KEYS = {
  theme: "colorMode",
  hue: "app-hue",
} as const;

const isClient = typeof window !== "undefined";
const hasLocalHue = () =>
  isClient && localStorage.getItem(STORAGE_KEYS.hue) !== null;

export const THEME_MODES = ["light", "dark", "auto"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

const MODE_CLASS_MAP: Record<ThemeMode, string> = {
  light: "", // light 模式下不加 class
  dark: "dark", // dark 模式下 html 标签加 'dark' class
  auto: "auto", // auto 模式
};

// 当前选中的深浅模式状态
export const colorMode = useColorMode<ThemeMode>({
  storageKey: STORAGE_KEYS.theme,
  initialValue: "auto",
  // 这里的 modes 可以自定义，但默认支持 auto/light/dark
  modes: MODE_CLASS_MAP,
  // 当为 auto 时，会自动根据系统偏好设置 light 或 dark class
  emitAuto: true,
  disableTransition: false,
});

// 是否为深色模式
export const isDark = computed(() =>
  colorMode.value === "dark" ||
  (colorMode.value === "auto" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
);

// 设置主题模式
export function setTheme(mode: ThemeMode) {
  colorMode.value = mode;
}

export function cycleTheme() {
  const currentIndex = THEME_MODES.indexOf(colorMode.value);
  const nextIndex = (currentIndex + 1) % THEME_MODES.length;
  setTheme(THEME_MODES[nextIndex]!);
}

// 默认色相 (蓝色)
export const DEFAULT_HUE = 250;

// 存储当前的 hue 值
export const currentHue = useStorage<number>(
  STORAGE_KEYS.hue,
  DEFAULT_HUE,
  undefined,
  { writeDefaults: false },
);

// 监听 hue 变化，实时设置 CSS 变量
watch(currentHue, (hue) => {
  document.documentElement.style.setProperty("--app-hue", hue.toString());
}, { immediate: true });

// 切换主题色相
export function setBrandHue(hue: number) {
  currentHue.value = hue;
}

type AppearanceConfig = {
  hue?: number;
};

// 仅在无本地色相时拉取管理员配置
async function applyAppearanceConfig() {
  if (!isClient) return;

  const userHueExists = hasLocalHue();

  // 本地已有用户色相则不请求后台
  if (userHueExists) return;

  try {
    const config = await getConfig("appearance");
    const configValue = config?.config?.configValue as
      | AppearanceConfig
      | undefined;

    if (!userHueExists && typeof configValue?.hue === "number") {
      setBrandHue(configValue.hue);
    }
  } catch (error) {
    console.error("[theme.hook] 获取 appearance 配置失败", error);
  }
}

applyAppearanceConfig();
