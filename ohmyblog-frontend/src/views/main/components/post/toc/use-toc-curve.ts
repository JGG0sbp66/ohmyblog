// src/views/main/components/post/toc/use-toc-curve.ts
import { type Ref, shallowRef, watch } from "vue";
import {
  useEventListener,
  usePreferredReducedMotion,
  useRafFn,
} from "@vueuse/core";

/**
 * 导轨曲线：一根两端固定的「弦」。
 *
 * 模型（demo 里逐轮调出来的，别随手改结构）：
 *   1. 导轨本身是直线，只有阅读位置附近的一个「活动窗口」会形变；
 *   2. 这个鼓包是常驻的 —— 静止时也保持 rest 高度，不会缩回直线，
 *      滚动只是在它之上叠加额外拉拽量，停下后回落到 rest；
 *   3. 幅度按「离导轨两端还有多远」收敛，保证 0% / 100% 是笔直的。
 *
 * 第 3 条不是锦上添花：没有它，窗口中心想鼓到 rest、而端点被 pin 在 0，
 * 两个约束在 0% / 100% 处重合、互相拉扯，会在端点挤出一个钩子。
 */

/** 导轨在 SVG 里的横坐标 */
export const RAIL_X = 10;

/** 采样点数。曲线由这些点做 Catmull-Rom 插值得到。 */
const N = 72;

export const CURVE = {
  /** 相邻点耦合强度 —— 决定「波」传得多快 */
  tension: 0.2,
  /** 回到常驻凸包的力 —— 越大越快收敛，太小会一直晃 */
  stiff: 0.022,
  /** 速度衰减 —— 决定甩出去之后晃几下 */
  damp: 0.86,
  /** 静止时的常驻凸出量（px） */
  rest: 13,
  /** 滚动速度 → 额外拉拽量的换算系数 */
  gain: 0.55,
  /** 额外拉拽量上限（px），叠加在 rest 之上 */
  max: 16,
  /** 活动窗口半高（px）—— 只有这一段会形变 */
  window: 110,
  /** 染主题色的比例（占窗口的多少） */
  accent: 0.45,
  /** 端点收敛距离（px）—— 头部离两端多近开始压平凸包 */
  edge: 90,
  /** 当前标题标签距导轨的横向间距（px） */
  flagGap: 40,
} as const;

/** 收敛判定阈值：位移与速度都低于它就认为静止 */
const SETTLE_EPS = 0.02;
/** 连续静止这么多帧后暂停 rAF，避免文章页常驻空转 */
const SETTLE_FRAMES = 8;

export interface CurvePoint {
  x: number;
  y: number;
}

/**
 * @param progress   阅读进度 0~1
 * @param height     导轨像素高度
 * @param dotAnchors 每个标题在导轨上的位置（0~1）
 */
export function useTocCurve(
  progress: Ref<number>,
  height: Ref<number>,
  dotAnchors: Ref<number[]>,
) {
  // 横向位移与速度
  const x = new Float32Array(N);
  const v = new Float32Array(N);
  /** 平滑后的滚动速度（px/frame），驱动额外拉拽量 */
  let scrollVel = 0;
  let lastScrollY = 0;
  let settled = 0;

  const railD = shallowRef("");
  const accentD = shallowRef("");
  const dots = shallowRef<CurvePoint[]>([]);
  const headY = shallowRef(0);

  const reduced = usePreferredReducedMotion();
  const isReduced = () => reduced.value === "reduce";

  // ---------------------------------------------------------------- 每帧
  const step = () => {
    const H = height.value;
    if (H <= 0) return;

    scrollVel *= 0.82;
    if (Math.abs(scrollVel) < 0.01) scrollVel = 0;

    const headIdx = progress.value * (N - 1);
    const spread = Math.max(2, (CURVE.window / H) * (N - 1));
    const windowAt = (i: number) =>
      0.5 * (1 + Math.cos(Math.PI * clamp((i - headIdx) / spread, -1, 1)));

    const room = smoothstep(edgeRoom(headIdx, H));
    const restAmp = CURVE.rest * room;

    if (isReduced()) {
      // 降低动效偏好：保留静止凸包的形状，但不做弹动
      for (let i = 0; i < N; i++) x[i] = restAmp * windowAt(i);
      settled = SETTLE_FRAMES + 1;
    } else {
      const amp =
        (CURVE.rest + Math.min(Math.abs(scrollVel) * CURVE.gain, CURVE.max)) *
        room;

      for (let i = 1; i < N - 1; i++) {
        const lap = ((x[i - 1] ?? 0) + (x[i + 1] ?? 0)) * 0.5 - (x[i] ?? 0);
        let vi = v[i] ?? 0;
        vi += lap * CURVE.tension;
        vi += (amp * windowAt(i) - (x[i] ?? 0)) * CURVE.stiff;
        v[i] = vi * CURVE.damp;
      }
      for (let i = 1; i < N - 1; i++) x[i] = (x[i] ?? 0) + (v[i] ?? 0);

      // 收敛回窗口：不只是「看不见」，而是真的不让位移逃出窗口，
      // 否则波会顺着导轨一路传出去，整根线都在晃。
      // 注意是收敛到常驻凸包，不是收敛到 0。
      let maxDelta = 0;
      for (let i = 0; i < N; i++) {
        const w = windowAt(i);
        const target = restAmp * w;
        x[i] = target + ((x[i] ?? 0) - target) * w;
        v[i] = (v[i] ?? 0) * w;
        maxDelta = Math.max(
          maxDelta,
          Math.abs((x[i] ?? 0) - target),
          Math.abs(v[i] ?? 0),
        );
      }
      x[0] = 0;
      v[0] = 0;
      x[N - 1] = 0;
      v[N - 1] = 0;

      settled = scrollVel === 0 && maxDelta < SETTLE_EPS ? settled + 1 : 0;
    }

    draw(H, headIdx, spread);

    // 已经完全稳定就停掉 rAF，滚动/尺寸变化时再唤醒
    if (settled > SETTLE_FRAMES) pause();
  };

  // ---------------------------------------------------------------- 渲染
  const draw = (H: number, headIdx: number, spread: number) => {
    const pts: CurvePoint[] = [];
    for (let i = 0; i < N; i++) {
      pts.push({ x: RAIL_X + (x[i] ?? 0), y: (i / (N - 1)) * H });
    }

    railD.value = spline(pts);

    // 主题色只染凸包中间一小截，两头留给灰线
    const half = spread * CURVE.accent;
    accentD.value = spline(
      sliceRange(
        pts,
        Math.max(0, headIdx - half),
        Math.min(N - 1, headIdx + half),
      ),
    );

    // 圆点贴着弦走
    dots.value = dotAnchors.value.map((p) => sampleAt(pts, p * (N - 1)));
    headY.value = sampleAt(pts, headIdx).y;
  };

  const { pause, resume } = useRafFn(step, { immediate: true });

  const wake = () => {
    settled = 0;
    resume();
  };

  useEventListener(
    window,
    "scroll",
    () => {
      scrollVel += window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      wake();
    },
    { passive: true },
  );
  useEventListener(window, "resize", wake, { passive: true });

  // 导轨高度、标题集合、动效偏好变化都要重画
  watch([height, dotAnchors, reduced], wake);

  return { railD, accentD, dots, headY };
}

// ------------------------------------------------------------------ 工具

function clamp(n: number, lo: number, hi: number) {
  return n < lo ? lo : n > hi ? hi : n;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/** 头部离导轨最近一端还有多少「余量」：0 = 贴在端点，1 = 离得够远 */
function edgeRoom(headIdx: number, H: number) {
  const px = (Math.min(headIdx, N - 1 - headIdx) / (N - 1)) * H;
  return clamp(px / Math.max(1, CURVE.edge), 0, 1);
}

/** 在采样点序列上按浮点下标取点（线性插值，视觉上看不出来） */
function sampleAt(pts: CurvePoint[], f: number): CurvePoint {
  const i = clamp(Math.floor(f), 0, pts.length - 2);
  const a = pts[i];
  const b = pts[i + 1];
  if (!a || !b) return { x: RAIL_X, y: 0 };
  const t = clamp(f - i, 0, 1);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** 取 [from, to] 这一段，两端用插值点补齐，避免端点跳格 */
function sliceRange(pts: CurvePoint[], from: number, to: number): CurvePoint[] {
  if (to - from < 0.02) return [];
  const out: CurvePoint[] = [sampleAt(pts, from)];
  for (let i = Math.ceil(from); i <= Math.floor(to); i++) {
    const p = pts[i];
    if (p) out.push(p);
  }
  out.push(sampleAt(pts, to));
  return out;
}

/** Catmull-Rom → 三次贝塞尔，保证曲线过每个采样点且切线连续 */
function spline(p: CurvePoint[]): string {
  if (p.length < 2) return "";
  const first = p[0];
  if (!first) return "";

  let d = `M ${r2(first.x)} ${r2(first.y)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p1 = p[i];
    const p2 = p[i + 1];
    if (!p1 || !p2) continue;
    const p0 = p[i - 1] ?? p1;
    const p3 = p[i + 2] ?? p2;
    d +=
      ` C ${r2(p1.x + (p2.x - p0.x) / 6)} ${r2(p1.y + (p2.y - p0.y) / 6)},` +
      ` ${r2(p2.x - (p3.x - p1.x) / 6)} ${r2(p2.y - (p3.y - p1.y) / 6)},` +
      ` ${r2(p2.x)} ${r2(p2.y)}`;
  }
  return d;
}

function r2(n: number) {
  return Math.round(n * 100) / 100;
}
