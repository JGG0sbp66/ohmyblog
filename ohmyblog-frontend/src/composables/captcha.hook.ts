// src/composables/captcha.hook.ts
//
// 验证码公开配置的读取，模块级单例（同 theme.hook.ts 的做法）。
//
// 三个页面要用它：登录、忘记密码、友链申请。做成单例是因为这三个页面之间
// 会互相跳转，各自拉一次没有意义；配置在一次会话里也几乎不会变。

import { readonly, ref } from "vue";
import { getCaptchaConfig } from "@/api/captcha.api";
import type { TCaptchaScene } from "@/api/shared";

/**
 * 公开配置的形状。
 *
 * 套一层 NonNullable：unwrap() 推出来的类型带 null（Eden 认为响应体可能为空），
 * 但这个接口在后端是恒定返回同一个对象的，留着 null 只会让每个使用处都要
 * 收窄一次。拿不到值的情况由下面的 DISABLED 兜底。
 */
type CaptchaPublicConfig = NonNullable<
  Awaited<ReturnType<typeof getCaptchaConfig>>
>;
export type { CaptchaPublicConfig };

/**
 * 未启用时的形态，也是拉取失败时的兜底。
 *
 * 与后端 getPublicConfig 的「没生效」分支保持同一形状 —— 后端刻意让两种
 * 情况返回同一个结构，前端这里也就不用分支处理。
 */
const DISABLED: CaptchaPublicConfig = {
  enabled: false,
  provider: null,
  siteKey: null,
  scenes: { login: false, forgotPassword: false, friendApply: false },
};
export { DISABLED as DISABLED_CAPTCHA_CONFIG };

const config = ref<CaptchaPublicConfig>(DISABLED);

/** 正在进行的拉取，用来让并发调用共用同一个请求 */
let inflight: Promise<void> | null = null;

/**
 * config 当前是否被设置页推来的未保存预览接管。
 *
 * 接管期间后端拉取的结果不能写回 —— 否则预览消息先到、后端响应后到时，
 * 会把未保存的状态冲掉，两种到达顺序都得是预览赢。
 */
let previewOverride = false;

/**
 * 最近一次发布的预览状态。只有设置页那个窗口会持有非 null 值，
 * 用来应答新预览页的 request-preview（切 tab 重建的 iframe 会重新拉
 * 后端配置，不间一声就会丢掉未保存的预览）。
 */
let lastPreview: CaptchaPublicConfig | null = null;

const fetchConfig = () =>
  getCaptchaConfig()
    .then((res) => {
      if (res && !previewOverride) config.value = res;
    })
    .catch((err) => {
      /*
        读不到就按未启用处理：页面照常能用，只是不显示验证框。

        这次失败不缓存 —— 下次进入需要验证码的页面时应该重试，否则一次
        网络抖动会让验证框在整个会话里都不出现，而后端那边验证码可能是
        开着的，用户就会撞上一句「人机验证未通过」却看不到任何验证框。
      */
      inflight = null;
      console.error("[Captcha] 读取验证码配置失败:", err);
    });

// 跨窗口同步：设置页与预览 iframe 各持一份单例，靠 BroadcastChannel
// 在同源窗口之间同步。消息分四种：
//   changed         保存成功后广播，各方重拉后端配置
//   preview         设置页表单变动时推送未保存状态，各方直接应用（不发
//                   请求，预览才能先于保存生效）；secretKey 只参与生效
//                   判断，不进消息体
//   clear           设置页退出且没保存，各方退回后端配置
//   request-preview 新加载的预览页问一声有没有未保存状态，持有者回 preview
const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("captcha-config")
    : null;

channel?.addEventListener("message", (event: MessageEvent) => {
  const msg = event.data as
    | {
        type: "changed" | "clear" | "request-preview";
      }
    | { type: "preview"; config: CaptchaPublicConfig };
  if (!msg || typeof msg.type !== "string") return;

  switch (msg.type) {
    case "changed":
    case "clear":
      previewOverride = false;
      lastPreview = null;
      inflight = fetchConfig();
      break;
    case "preview":
      previewOverride = true;
      config.value = msg.config;
      break;
    case "request-preview":
      if (lastPreview) {
        channel?.postMessage({ type: "preview", config: lastPreview });
      }
      break;
  }
});

// 刚加载的窗口问一声有没有未保存的预览态：典型场景是预览 tab 切换导致
// iframe 重建，它会重新拉后端配置，不拦一手就会把未保存的预览冲掉
channel?.postMessage({ type: "request-preview" });

export function useCaptcha() {
  /** 确保配置已加载，重复调用共用同一个请求 */
  const load = () => {
    inflight ??= fetchConfig();
    return inflight;
  };

  /** 强制重新拉取。后台改完配置后调用，好让预览立刻反映新值 */
  const refresh = () => {
    inflight = fetchConfig();
    return inflight;
  };

  /**
   * 后台保存配置后调用：本地重拉，并广播给其他同源窗口。
   *
   * 预览框是同源的 iframe，它有独立的 JS 运行时，里面的这份单例和设置页
   * 的不是同一个 —— 只刷新自己这边，iframe 里的验证框不会动。靠
   * BroadcastChannel 通知所有同源上下文各自重拉（消息不会送回发送者，
   * 所以本地要自己 refresh 一次）。
   */
  const notifyChanged = () => {
    previewOverride = false;
    lastPreview = null;
    channel?.postMessage({ type: "changed" });
    return refresh();
  };

  /**
   * 发布未保存的表单状态（仅设置页调用）。
   *
   * 传配置形状时广播 preview，各预览窗口直接应用，开关一动预览就变，
   * 不用等保存；传 null 表示预览结束（设置页退出），广播 clear 让各方
   * 退回后端配置，免得没保存的幽灵状态一直留着。
   */
  const publishPreview = (preview: CaptchaPublicConfig | null) => {
    lastPreview = preview;
    channel?.postMessage(
      preview ? { type: "preview", config: preview } : { type: "clear" },
    );
  };

  /**
   * 某个入口要不要显示验证框。
   *
   * 只看 scenes 即可 —— 后端在未生效时已经把三个场景一律置成 false，
   * 这里不用再与 enabled 相与。
   */
  const isEnabledFor = (scene: TCaptchaScene) => config.value.scenes[scene];

  return {
    config: readonly(config),
    load,
    refresh,
    notifyChanged,
    publishPreview,
    isEnabledFor,
  };
}
