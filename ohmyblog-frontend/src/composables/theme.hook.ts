// src/composables/theme.hook.ts
import { debounceFilter, useColorMode, useStorage } from "@vueuse/core";
import { computed, nextTick, watch } from "vue";
import { getConfig } from "@/api/config.api";
import type { TThemeMode } from "@/api/shared";
import { THEME_MODES } from "@/api/shared";

/**
 * 主题配置常量存储键名
 */
const STORAGE_KEYS = {
  THEME: "colorMode", // 存储主题模式 (light/dark/auto)
  HUE: "app-hue", // 存储主题色相 (0-360)
} as const;

/**
 * 默认视觉配置
 */
export const DEFAULT_HUE = 250; // 默认品牌色相 (蓝色)

/**
 * 换主题期间挂在 <html> 上的两个状态类，定义见 css/tailwind.css
 *
 * - SHIFTING：压掉每个元素自己的颜色过渡，避免它们各按自己的时长去追
 *   --app-hue 的插值（既错拍，也是拖拽卡顿的主因）
 * - HUE_ANIM：给 --app-hue 本身挂补间。只有离散改色才挂，拖拽时不挂
 */
const CLASS_SHIFTING = "theme-shifting";
const CLASS_HUE_ANIM = "hue-animating";

const root = document.documentElement;

/**
 * 滑块松手后额外保持压制状态的时间 (ms)
 * 覆盖住浏览器把最后一帧刷完的间隙，避免尾帧被逐元素过渡接管
 */
const LIVE_SETTLE_MS = 120;

/** 换主题时长的缓存值，惰性读取一次即可 */
let durationCache: number | null = null;

/**
 * 读取 CSS 里的统一过渡时长，保证 JS 的收尾时机和 CSS 完全同源
 * 只在首次换主题时强制读一次样式，之后走缓存
 */
function themeDuration(): number {
  if (durationCache !== null) return durationCache;

  const raw = getComputedStyle(root)
    .getPropertyValue("--default-transition-duration")
    .trim();
  const parsed = raw.endsWith("ms")
    ? Number.parseFloat(raw)
    : Number.parseFloat(raw) * 1000;

  durationCache = Number.isFinite(parsed) && parsed > 0 ? parsed : 200;
  return durationCache;
}

// --- 色相写入 ---

let hueRaf = 0;
let pendingHue: number | null = null;
let shiftTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * 当前真正写进 CSS 的角度
 * 可能超出 0-360：oklch 的 hue 本就是模 360 的，写 370 和写 10 等价，
 * 借此让补间走最短弧（否则 350 → 10 会扫过整条色环）
 */
let appliedAngle = DEFAULT_HUE;

/** 本次写入是否来自滑块跟手（由 previewHue 置位，watch 消费后复位） */
let liveApply = false;

/**
 * 求与 to 等价、且离 from 最近的角度
 * @example nearestAngle(350, 10) === 370  // 走 20° 短弧，而不是 -340°
 */
function nearestAngle(from: number, to: number): number {
  const delta = ((((to - from) % 360) + 540) % 360) - 180;
  return from + delta;
}

/** 丢弃挂起的跟手写入 */
function cancelPendingHue() {
  if (hueRaf) {
    cancelAnimationFrame(hueRaf);
    hueRaf = 0;
  }
  pendingHue = null;
}

/** 延时结束换主题状态，恢复各组件自己的 hover 过渡 */
function endShift(delay: number) {
  clearTimeout(shiftTimer);
  shiftTimer = setTimeout(() => {
    root.classList.remove(CLASS_HUE_ANIM, CLASS_SHIFTING);
  }, delay);
}

/** 写入色相变量 */
function writeHue(angle: number) {
  appliedAngle = angle;
  root.style.setProperty("--app-hue", String(angle));
}

/**
 * 同步立即写入，不补间也不等下一帧
 * 首帧初始化用：晚一帧会闪一下 CSS 里的默认蓝
 */
function applyHueNow(val: number) {
  cancelPendingHue();
  root.classList.remove(CLASS_HUE_ANIM);
  root.classList.add(CLASS_SHIFTING);
  writeHue(val);
  endShift(LIVE_SETTLE_MS);
}

/**
 * 写入色相
 * @param val 色相值 (0-360)
 * @param animate true = 走 200ms 补间（预设按钮、远端配置同步）；
 *                false = 跟手，一帧最多写一次（滑块拖拽）
 */
function applyHue(val: number, animate: boolean) {
  root.classList.add(CLASS_SHIFTING);
  root.classList.toggle(CLASS_HUE_ANIM, animate);

  if (animate) {
    cancelPendingHue();
    writeHue(nearestAngle(appliedAngle, val));
    // 多留一点余量，确保补间跑完才把逐元素过渡放回来
    endShift(themeDuration() + 50);
    return;
  }

  // 跟手模式：一帧最多写一次，避免一次拖拽触发上百次整树样式重算
  pendingHue = val;
  if (hueRaf) return;

  hueRaf = requestAnimationFrame(() => {
    hueRaf = 0;
    if (pendingHue === null) return;
    writeHue(pendingHue);
    pendingHue = null;
    // 每帧都会重排这个定时器，等价于「最后一次输入之后 120ms」
    endShift(LIVE_SETTLE_MS);
  });
}

// --- 状态管理 (单例模式，确保应用全局状态统一) ---

/**
 * 当前选中的深浅模式状态
 * 使用 VueUse 的 useColorMode 自动处理：
 * 1. 本地存储 (LocalStorage) 的读取与同步
 * 2. <html> 标签上的 .dark 类名切换
 * 3. 当设置为 'auto' 时，自动监听系统的 prefers-color-scheme
 */
const colorMode = useColorMode<TThemeMode>({
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
  /*
    拖拽时不要每一跳都同步写 localStorage：写入本身阻塞主线程，而且会通过
    storage 事件让后台外观页里那个跑着整份前台的预览 iframe 也整页重绘，
    等于每一跳重绘两个文档。

    eventFilter 只作用于 useStorage 的「写」侧，进来的 storage 监听不受影响，
    所以 iframe 的联动通道仍在，只是从每秒几十次收敛成每次停顿一次 ——
    对 iframe 而言就成了一次离散跳变，正好吃到 200ms 扫掠。
  */
  eventFilter: debounceFilter(250),
});

/*
  首帧直接落位，不做扫掠，也不能延到下一帧（否则会闪一下默认蓝）
*/
applyHueNow(hueStore.value);

/**
 * 全局监听：把 hueStore 的值同步到 CSS 变量
 * 无论是通过 previewHue / setBrandHue 更新，还是别处直接操作 hueStore，
 * 甚至是跨文档的 storage 事件（预览 iframe），都会走到这里
 */
watch(hueStore, (val) => {
  applyHue(val, !liveApply);
  liveApply = false;
});

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
   *
   * 用 View Transitions 做整页一次交叉淡入：所有元素天然同步，
   * 且只有一层合成开销，比让上千个元素各自跑 200ms 颜色过渡更省。
   */
  const setTheme = (mode: TThemeMode) => {
    /*
      同样要压掉逐元素颜色过渡，两个原因：
      1. View Transitions 抓「新快照」的时机就在回调之后，若各元素还在跑
         自己的过渡，快照拍到的是过渡途中的旧色，淡入就等于没换色
      2. 避免快照淡入之外再叠一层逐元素过渡
    */
    root.classList.add(CLASS_SHIFTING);

    const commit = () => {
      colorMode.value = mode;
      // 等 Vue 把 .dark 相关的 DOM 刷完，再让浏览器拍新快照
      return nextTick();
    };

    const start = document.startViewTransition?.bind(document);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // 浏览器不支持或用户偏好减少动效时，退回瞬时切换
    if (!start || reduceMotion) {
      void commit().then(() => endShift(0));
      return;
    }

    start(commit).finished.finally(() => endShift(0));
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
   * 实时预览色相：跟手写入，不做补间
   * 供滑块拖拽使用 —— 拇指本身就是动画，补间只会让页面追不上手
   * @param val 色相值 (0-360)
   */
  const previewHue = (val: number) => {
    // 值没变时 watch 不会触发，直接返回，避免 liveApply 卡在 true
    // 让下一次离散改色错误地走成瞬切
    if (val === hueStore.value) return;
    liveApply = true;
    hueStore.value = val;
  };

  /**
   * 更新品牌主色相：带补间写入，全站颜色一起扫过去
   * 供预设按钮、程序化切换使用
   * @param val 色相值 (0-360)
   */
  const setBrandHue = (val: number) => {
    liveApply = false;
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
        // 首屏用跟手路径直接落位：拉到配置就扫一遍色，看着像加载出错
        previewHue(remoteHue);
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
    previewHue,
    setBrandHue,
    initThemeConfig,

    // 常量
    DEFAULT_HUE,
  };
}
