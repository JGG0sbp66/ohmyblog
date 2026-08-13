<!-- src/views/admin/components/forgot-password/ForgotPasswordUnavailable.vue -->
<!--
  忘记密码 - 邮件服务未配置时的兜底页

  为什么需要这一屏：忘记密码全靠发邮件，而 SMTP 未配置正是新装站点的默认
  状态。后端在这种情况下只能静默失败（返回报错会让接口变成邮箱枚举器），
  所以如果不拦在前面，用户会对着一个永远收不到邮件的表单反复提交。

  这一屏真正要做成的事只有一件：把「适配他这套部署的那条命令」送进剪贴板。
  所以不并排摊开三条命令让人自己认领 —— 一个站点只有一种部署方式，
  先选后看，屏幕上任何时候只有一条命令。纯展示组件。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AuthCard from "@/components/base/card/AuthCard.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import SegmentedControl from "@/components/base/control/SegmentedControl.vue";
import BaseCheckbox from "@/components/base/table/BaseCheckbox.vue";
import CodeBlockActions from "@/components/common/code/CodeBlockActions.vue";
import { RiArrowLeftLine } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import {
  highlightToHtml,
  resolveLanguageIcon,
  preloadLanguageIcons,
  formatLanguageLabel,
  countCodeLines,
} from "@/composables/code-block";

const emit = defineEmits<{
  /** 返回登录页 */
  back: [];
}>();

const { t } = useLang();

/**
 * 按部署方式给出对应命令，数组顺序即分段选择器里的顺序。
 *
 * 重置入口是主程序的子命令，所以二进制和 Docker 部署下不需要源码也不需要
 * 装 bun。Docker 那条带 -u 10001：容器里主程序以该 UID 运行，若以 root
 * 执行会让 SQLite 新建的 -wal / -shm 文件归 root，之后主程序就写不动了
 */
const DEPLOYMENTS = [
  { key: "cmdBinary", command: "./ohmyblog reset-password" },
  {
    key: "cmdDocker",
    command: "docker exec -it -u 10001 ohmyblog /app/ohmyblog reset-password",
  },
  { key: "cmdSource", command: "bun run reset-password" },
] as const;

type DeployKey = (typeof DEPLOYMENTS)[number]["key"];

/**
 * 关闭两步验证的追加参数。前导空格连同参数一起存：
 * 拼命令和高亮取的是同一个值，不会出现「看着有空格、复制没空格」
 */
const TWO_FACTOR_SUFFIX = " --disable-2fa";

/** 语法名（进 highlightToHtml / resolveLanguageIcon），展示名由 formatLanguageLabel 派生 */
const LANGUAGE = "bash";

const deployKey = ref<DeployKey>("cmdBinary");
const disableTwoFactor = ref(false);

const deployOptions = computed(() =>
  DEPLOYMENTS.map((item) => ({
    value: item.key,
    label: t(`views.forgotPassword.unavailable.${item.key}`),
  })),
);

const baseCommand = computed(
  () =>
    (DEPLOYMENTS.find((item) => item.key === deployKey.value) ?? DEPLOYMENTS[0])
      .command,
);

/** 真正复制出去、也是渲染进代码块的整条命令 */
const fullCommand = computed(() =>
  disableTwoFactor.value
    ? baseCommand.value + TWO_FACTOR_SUFFIX
    : baseCommand.value,
);

// ─── 代码块 ──────────────────────────────────────────────────────────────────
// 类名、结构、逻辑全部取自文章代码块那一套：外观由全局 css/tiptap/code-block.css
// 提供（靠外层 .tiptap 包裹类命中，与阅读端 PostContent.vue 同一手法），
// 高亮 / 图标 / 展示名 / 行数来自 @/composables/code-block，
// header 右侧两个按钮直接用 CodeBlockActions。
// 因此这里不写任何自己的配色与尺寸 —— 站内代码块只有一份样式、一份逻辑。

/** 兜底：bash 必在语言集内，highlightToHtml 不该返回 null，真返回了就退化为纯文本 */
const escapeHtml = (raw: string) =>
  raw.replace(
    /[&<>]/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch] ?? ch,
  );

const codeHtml = computed(
  () =>
    highlightToHtml(fullCommand.value, LANGUAGE) ??
    escapeHtml(fullCommand.value),
);

const lineCount = computed(() => countCodeLines(fullCommand.value));

// 图标表按需加载（见 composables/code-block/icons.ts）：表就绪前先渲染兜底图标，
// 图标位始终有内容，不会因为图标晚到而抖动 header
const iconsReady = ref(false);
onMounted(() => {
  void preloadLanguageIcons().then(() => {
    iconsReady.value = true;
  });
});

const languageIcon = computed(() => {
  void iconsReady.value; // 建立依赖：图标表加载完成后重算
  return resolveLanguageIcon(LANGUAGE);
});

// 换行默认关闭，与编辑器（CodeBlock.vue）和阅读端（enhance-code-blocks.ts）一致 ——
// 那两处都是组件内一个硬编码的局部变量、刻意不持久化（换行是阅读姿势，写进
// node.attrs 就会进 contentHtml 污染 RSS）。这一屏没有理由自成一格。
//
// 行号不需要 syncLineNumberHeights：那个函数解决的是「多个逻辑行各自软换行后
// 行号错位」，而这里恒为一行，换行与否那个「1」都落在首个视觉行上。
const wrap = ref(false);
</script>

<template>
  <AuthCard
    :title="t('views.forgotPassword.unavailable.title')"
    :description="t('views.forgotPassword.unavailable.description')"
  >
    <!--
      三步之间是真实的先后依赖（先登上服务器才谈得上跑命令），所以用 <ol>。
      序号走左侧竖轨而不是 list-decimal：第 2 步要挂选择器和代码块两块整宽内容，
      塞进列表项的文字流里会被行盒挤扁。
      竖轨用真实 <span> 而非 ::before，纯 Tailwind 就能表达，省掉一整块 CSS
    -->
    <ol class="flex flex-col gap-5 onload-animation anim-delay-50">
      <!-- 1. 登上服务器 -->
      <li class="relative pl-9">
        <span
          class="absolute left-3 top-7 -bottom-5 w-px bg-fg-muted/15"
          aria-hidden="true"
        />
        <span
          class="absolute left-0 top-0 flex items-center justify-center w-6 h-6 rounded-md bg-bg-muted font-mono text-[11px] text-fg-muted"
          >1</span
        >
        <p class="text-fg text-sm leading-6">
          {{ t("views.forgotPassword.unavailable.step1") }}
        </p>
      </li>

      <!-- 2. 选部署方式 → 拿到那条命令 -->
      <li class="relative pl-9">
        <span
          class="absolute left-3 top-7 -bottom-5 w-px bg-fg-muted/15"
          aria-hidden="true"
        />
        <span
          class="absolute left-0 top-0 flex items-center justify-center w-6 h-6 rounded-md bg-bg-muted font-mono text-[11px] text-fg-muted"
          >2</span
        >
        <p class="text-fg text-sm leading-6">
          {{ t("views.forgotPassword.unavailable.step2") }}
        </p>

        <div class="mt-3 flex flex-col gap-3">
          <SegmentedControl v-model="deployKey" :options="deployOptions" />

          <!--
            代码块。包裹类 .tiptap 与 PostContent.vue 同理：让全局
            css/tiptap/code-block.css 命中，外观与文章里逐像素一致。
            内部结构严格对齐 CodeBlock.vue / enhance-code-blocks.ts 的产物。

            m-0!：文章里代码块靠 margin: 1.5rem 0 与上下文分隔，这里它在 flex gap
            的栈里，那份外边距是多余的空档。全局规则特异性 (0,2,0) 高过普通工具类，
            必须带 ! 才压得住 —— 只改间距，不碰任何外观
          -->
          <div class="tiptap">
            <div class="code-block-container m-0!" :class="{ 'is-wrap': wrap }">
              <div class="code-block-header">
                <div class="code-block-lang">
                  <!-- 图标来自生成的静态表，非用户输入，无需净化 -->
                  <span class="code-block-lang-icon" v-html="languageIcon" />
                  <span class="code-block-lang-input">{{
                    formatLanguageLabel(LANGUAGE)
                  }}</span>
                </div>

                <CodeBlockActions
                  v-model:wrap="wrap"
                  :text="fullCommand"
                  :copy-label="t('views.forgotPassword.unavailable.copy')"
                />
              </div>

              <div class="code-block-content">
                <div class="line-numbers">
                  <span v-for="n in lineCount" :key="n">{{ n }}</span>
                </div>
                <!-- 命令是本文件里的常量，highlightToHtml 的产出也只含 hljs-* 标记，
                     不经用户输入，无需 DOMPurify -->
                <pre><code
                  class="hljs"
                  :style="{ whiteSpace: wrap ? 'pre-wrap' : 'pre' }"
                  v-html="codeHtml"
                ></code></pre>
              </div>
            </div>
          </div>

          <!--
            原先这里是一句「验证器也丢了就在命令后加上 --disable-2fa」的小字，
            可复制按钮送出去的仍是不带该参数的命令，等于让人复制完再手动补一遍。
            改成开关：命令本身跟着变，复制到的就是能直接粘进终端执行的那条。

            整行可点靠外层 div 的 click：BaseCheckbox 自己的 click 带 .stop，
            不会冒泡上来触发第二次翻转。键盘用户 Tab 到的是内部那个 button，
            外层这一下纯属鼠标便利，不影响可达性
          -->
          <div
            class="flex items-center gap-2.5 w-fit cursor-pointer group"
            @click="disableTwoFactor = !disableTwoFactor"
          >
            <BaseCheckbox
              v-model="disableTwoFactor"
              :aria-label="
                t('views.forgotPassword.unavailable.twoFactorToggle')
              "
            />
            <span
              class="text-fg-subtle text-xs leading-5 transition-colors group-hover:text-fg"
            >
              {{ t("views.forgotPassword.unavailable.twoFactorToggle") }}
            </span>
          </div>
        </div>
      </li>

      <!-- 3. 设新密码。最后一步不画竖轨，线到此为止 —— 收尾本身就在说「一共三步」 -->
      <li class="relative pl-9">
        <span
          class="absolute left-0 top-0 flex items-center justify-center w-6 h-6 rounded-md bg-bg-muted font-mono text-[11px] text-fg-muted"
          >3</span
        >
        <p class="text-fg text-sm leading-6">
          {{ t("views.forgotPassword.unavailable.step3") }}
        </p>
      </li>
    </ol>

    <!-- 另一条路：配好邮件服务。它不是这套流程的一环，所以留在步骤之外 -->
    <p class="text-fg-subtle text-xs leading-5 onload-animation anim-delay-100">
      {{ t("views.forgotPassword.unavailable.smtpHint") }}
    </p>

    <!-- 分割线 -->
    <div class="border-t border-fg-muted/15"></div>

    <!-- 返回登录 -->
    <div class="onload-animation anim-delay-150">
      <ButtonSecondary
        :text="t('views.forgotPassword.unavailable.backToLogin')"
        @click="emit('back')"
        class="w-full px-4! py-2!"
      >
        <RiArrowLeftLine class="w-5 h-5" aria-hidden="true" />
      </ButtonSecondary>
    </div>
  </AuthCard>
</template>
