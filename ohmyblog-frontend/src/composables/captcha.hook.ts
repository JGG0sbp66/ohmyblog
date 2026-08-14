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

const config = ref<CaptchaPublicConfig>(DISABLED);

/** 正在进行的拉取，用来让并发调用共用同一个请求 */
let inflight: Promise<void> | null = null;

const fetchConfig = () =>
  getCaptchaConfig()
    .then((res) => {
      if (res) config.value = res;
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
    isEnabledFor,
  };
}
