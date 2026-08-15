<!-- src/components/common/captcha/CaptchaWidget.vue -->
<!--
  人机验证框。

  对外只有 provider + siteKey 两个输入和一个 v-model，调用方不需要知道
  用的是哪家、也不需要碰任何厂商 API。两条路径由 vendorKind 分流：

    box   —— Turnstile / hCaptcha：页面上真有个框，用户点一下产出 token
    score —— reCAPTCHA v3：没有框，提交那一刻现算一个 token

  所以调用方统一用 `await captchaRef.execute()` 拿 token：box 模式返回用户
  已经点出来的那个（没点则返回 null），score 模式当场算一个。

  提交失败后必须调 reset()：token 是一次性的，不重置的话用户再点一次提交
  仍然必败，而界面上看不出任何异常。
-->
<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef, watch } from "vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import {
  BOX_HEIGHT,
  getBoxVendor,
  getScoreVendor,
  loadVendorScript,
  vendorKind,
} from "@/composables/captcha-vendor";
import { useLang } from "@/composables/lang.hook";
import { useTheme } from "@/composables/theme.hook";
import Loading from "@/components/common/item/Loading.vue";
import type { TCaptchaProvider } from "@/api/shared";

const props = withDefaults(
  defineProps<{
    /** 服务商，取自 GET /api/captcha */
    provider: TCaptchaProvider;
    /** 站点密钥，取自 GET /api/captcha */
    siteKey: string;
    /** reCAPTCHA v3 的行为名，会出现在 Google 后台的统计里 */
    action?: string;
  }>(),
  { action: "submit" },
);

/** 一次性凭证。box 模式由用户点出来，score 模式由 execute() 产出 */
const token = defineModel<string>({ default: "" });

const { t } = useLang();
const { isDark } = useTheme();

// 根容器挂 auto-animate：切服务商时 box 框 ↔ score 声明文字是「常驻组件内部
// 的直接子节点互换」，外层的 auto-animate 都观察不到，容器高度会瞬变，
// 只能在这一层自己接住
const [widgetRef] = useAutoAnimate();

const boxRef = useTemplateRef<HTMLDivElement>("boxRef");

/** 脚本没加载完之前提示一句，免得站长以为配错了 */
const status = ref<"loading" | "ready" | "failed">("loading");

/** box 模式下厂商返回的 widget 句柄，reset / remove 都要用它 */
let widgetId: string | null = null;

/**
 * 当前 widget 是【哪一家】渲染出来的。
 * 不能用 props.provider 代替 —— watch 触发重挂时 props 已经变成新服务商了，
 * 拿新服务商去 remove 旧服务商的 widget 必然失败，旧框就会一直留在容器里，
 * 来回切服务商会叠出好几个验证码框
 */
let mountedProvider: TCaptchaProvider | null = null;

/** mount 是异步的，快速切换时会有多个同时在跑，只有最后一次才允许落地 */
let mountSeq = 0;
let alive = true;

/** 卸载已渲染的框。切服务商、换 siteKey、组件卸载时都要先清干净 */
const teardown = () => {
  if (widgetId === null) return;
  try {
    getBoxVendor(mountedProvider!)?.remove(widgetId);
  } catch {
    // 厂商脚本在页面卸载途中可能已经不可用了，这里失败无所谓
  }
  widgetId = null;
  mountedProvider = null;
};

/** 按当前 provider / siteKey 重新挂一个框 */
const mount = async () => {
  teardown();
  token.value = "";
  status.value = "loading";

  if (!props.siteKey) return;

  // 先把本次要挂的参数快照下来，后面一律用快照，不读可能已经变掉的 props
  const seq = ++mountSeq;
  const provider = props.provider;
  const siteKey = props.siteKey;

  try {
    await loadVendorScript(provider, siteKey);
  } catch {
    if (seq !== mountSeq || !alive) return;
    status.value = "failed";
    return;
  }

  // 等待期间来了更新的 mount（或组件已卸载），本次直接放弃，
  // 否则会和后来的那次各挂一个框，叠出多个验证码
  if (seq !== mountSeq || !alive) return;

  if (vendorKind(provider) === "score") {
    // v3 没有要渲染的东西，脚本就绪即可用
    status.value = "ready";
    return;
  }

  const vendor = getBoxVendor(provider);
  const el = boxRef.value;
  if (!vendor || !el) {
    status.value = "failed";
    return;
  }

  widgetId = vendor.render(el, {
    sitekey: siteKey,
    theme: isDark.value ? "dark" : "light",
    callback: (value: string) => {
      token.value = value;
    },
    // 凭证有有效期，过期后厂商会回调这里。清掉本地的值，让调用方
    // 在提交前就能发现「还没验证」，而不是提交到后端才被判 timeout
    "expired-callback": () => {
      token.value = "";
    },
    "error-callback": () => {
      token.value = "";
    },
  });
  mountedProvider = provider;

  status.value = "ready";
};

/**
 * 重置：作废当前凭证，让用户能重新验证一次。
 * 提交失败后必须调，否则用户会卡在一个永远过不去的表单里。
 */
const reset = () => {
  token.value = "";
  if (widgetId === null) return;
  try {
    getBoxVendor(mountedProvider!)?.reset(widgetId);
  } catch {
    // 同 teardown：厂商脚本不可用时忽略
  }
};

/**
 * 取一个可用的凭证。
 *
 * @returns box 模式返回用户已点出的凭证（没点则 null）；
 *          score 模式当场向 Google 要一个
 */
const execute = async (): Promise<string | null> => {
  if (vendorKind(props.provider) === "box") {
    return token.value || null;
  }

  const vendor = getScoreVendor();
  if (!vendor || !props.siteKey) return null;

  try {
    const value = await new Promise<string>((resolve, reject) => {
      vendor.ready(() => {
        vendor
          .execute(props.siteKey, { action: props.action })
          .then(resolve)
          .catch(reject);
      });
    });
    token.value = value;
    return value;
  } catch {
    token.value = "";
    return null;
  }
};

// provider / siteKey 变了就整个重挂 —— 后台设置页里站长会来回切服务商、
// 改密钥，框必须跟着换，否则点出来的凭证属于上一家，测试永远不过
watch(
  () => [props.provider, props.siteKey],
  () => {
    void mount();
  },
  { immediate: true, flush: "post" },
);

// 深浅色是渲染参数，切换主题时也要重挂才生效
watch(isDark, () => {
  if (vendorKind(props.provider) === "box") void mount();
});

onBeforeUnmount(() => {
  alive = false;
  teardown();
});

defineExpose({ reset, execute });
</script>

<template>
  <div ref="widgetRef" class="flex flex-col gap-2 text-left">
    <!-- box 模式：厂商的框挂在这里。留出高度，免得脚本加载完那一刻表单往下跳 -->
    <div
      v-if="vendorKind(provider) === 'box'"
      ref="boxRef"
      :style="{ minHeight: `${BOX_HEIGHT[provider] ?? 65}px` }"
      class="flex items-center transition-[min-height] duration-250 ease-in-out"
    >
      <!-- 加载指示器单独套一层全宽居中容器：不能给 boxRef 加 justify-center，
           否则厂商渲染出来的验证框也会跟着居中 -->
      <div
        v-if="status === 'loading'"
        class="flex w-full items-center justify-center"
      >
        <Loading size-class="w-6 h-6" color-class="text-accent" />
      </div>
    </div>

    <!-- score 模式：没有框，但 Google 要求页面上有一句声明 -->
    <p v-else class="text-xs text-fg-soft leading-relaxed">
      {{ t("components.common.captcha.recaptchaNotice") }}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        class="text-accent hover:underline"
        >{{ t("components.common.captcha.privacyPolicy") }}</a
      >
      <span class="mx-1 text-fg-soft/60">·</span>
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        class="text-accent hover:underline"
        >{{ t("components.common.captcha.termsOfService") }}</a
      >
    </p>

    <!-- 脚本压根没加载起来时说清楚，否则站长只会看到一片空白 -->
    <p v-if="status === 'failed'" class="text-xs text-red-500">
      {{ t("components.common.captcha.loadFailed") }}
    </p>
  </div>
</template>
