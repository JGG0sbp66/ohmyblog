<!-- src/components/common/code/CodeBlockActions.vue -->
<script setup lang="ts">
/**
 * CodeBlockActions —— 代码块 header 右侧的动作区：换行开关 + 复制按钮。
 *
 * 站内代码块有三处，DOM 各写一份是被迫的：
 *   1. 后台编辑器 NodeView（node-views/CodeBlock.vue）
 *      —— 容器必须是 <node-view-wrapper> 本身，否则 select-all.extension 打在
 *         节点根上的 .pm-block-selected 会落到外层，选中描边失效
 *   2. 前台阅读端（post/enhance-code-blocks.ts）
 *      —— 正文是 contentHtml 字符串经 v-html 落地的，Vue 没法在里面渲染组件
 *   3. 忘记密码兜底页（forgot-password/ForgotPasswordUnavailable.vue）
 *
 * 但这两个按钮是三处唯一「完全相同、又不受上述结构约束」的部分，故收成组件，
 * 供 1 和 3 共用；2 只能继续手写 DOM，靠共用类名与 COPY_FEEDBACK_MS 保持一致。
 *
 * 外观全部来自全局 css/tiptap/code-block.css，本组件只负责 DOM 结构与复制状态。
 */
import { onBeforeUnmount, ref } from "vue";
import { Check, Copy, TextWrap } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { COPY_FEEDBACK_MS } from "@/composables/code-block";

const props = defineProps<{
  /** 是否软换行，配合 v-model:wrap 使用 */
  wrap: boolean;
  /** 点复制时写进剪贴板的文本 */
  text: string;
  /** 复制按钮的无障碍标签，缺省为「复制代码」 */
  copyLabel?: string;
}>();

const emit = defineEmits<{ "update:wrap": [value: boolean] }>();

const { t } = useLang();

const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.text);
  } catch {
    // 非 HTTPS / 无剪贴板权限时 writeText 会抛。不接住的话就是一次静默的
    // unhandled rejection —— 按钮不给对勾、也没有任何解释，
    // 用户只当是自己没点中，会反复点
    useToast.error(t("common.copyFailed"));
    return;
  }

  copied.value = true;
  // 连点时重置计时，避免多个 timer 竞争导致对勾提前复原
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copied.value = false;
    copyTimer = null;
  }, COPY_FEEDBACK_MS);
};

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer);
});
</script>

<template>
  <!-- contenteditable="false" 是编辑器的需要（拦住 ProseMirror 把按钮当可编辑区）；
       另外两处本就不可编辑，这个属性对它们是空操作，因此无需做成 prop -->
  <div class="code-block-actions" contenteditable="false">
    <button
      class="code-block-header-btn code-block-wrap-btn"
      :class="{ 'is-active': wrap }"
      type="button"
      :aria-pressed="wrap"
      :aria-label="
        t(
          wrap
            ? 'views.admin.PostEditor.content.codeBlock.wrapOff'
            : 'views.admin.PostEditor.content.codeBlock.wrapOn',
        )
      "
      @click="emit('update:wrap', !wrap)"
    >
      <TextWrap :size="13" />
    </button>

    <button
      class="code-block-header-btn code-block-copy-btn"
      :class="{ copied }"
      type="button"
      :aria-label="
        copyLabel ?? t('views.admin.PostEditor.content.codeBlock.copy')
      "
      @click="handleCopy"
    >
      <Check v-if="copied" :size="13" />
      <Copy v-else :size="13" />
    </button>
  </div>
</template>
