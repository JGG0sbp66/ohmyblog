<!-- src/views/admin/components/forgot-password/ForgotPasswordUnavailable.vue -->
<!--
  忘记密码 - 邮件服务未配置时的兜底页

  为什么需要这一屏：忘记密码全靠发邮件，而 SMTP 未配置正是新装站点的默认
  状态。后端在这种情况下只能静默失败（返回报错会让接口变成邮箱枚举器），
  所以如果不拦在前面，用户会对着一个永远收不到邮件的表单反复提交。

  这里给出唯一可行的自救方式：在服务器上跑命令行脚本。纯展示组件。
-->
<script setup lang="ts">
import AuthCard from "@/components/base/card/AuthCard.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import {
  RiArrowLeftLine,
  RiMailForbidLine,
} from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";

const emit = defineEmits<{
  /** 返回登录页 */
  back: [];
}>();

const { t } = useLang();

/**
 * 按部署方式给出对应命令。
 *
 * 重置入口是主程序的子命令，所以二进制和 Docker 部署下不需要源码也不需要
 * 装 bun。Docker 那条带 -u 10001：容器里主程序以该 UID 运行，若以 root
 * 执行会让 SQLite 新建的 -wal / -shm 文件归 root，之后主程序就写不动了
 */
const COMMANDS = [
  { key: "cmdBinary", value: "./ohmyblog reset-password" },
  {
    key: "cmdDocker",
    value: "docker exec -it -u 10001 ohmyblog /app/ohmyblog reset-password",
  },
  { key: "cmdSource", value: "bun run reset-password" },
] as const;
</script>

<template>
  <AuthCard :description="t('views.forgotPassword.unavailable.description')">
    <template #title>
      <div class="flex items-center gap-2">
        <RiMailForbidLine class="w-6 h-6 text-fg-subtle" aria-hidden="true" />
        <span>{{ t("views.forgotPassword.unavailable.title") }}</span>
      </div>
    </template>

    <!-- 命令行恢复指引 -->
    <div
      class="flex flex-col gap-3 rounded-lg border border-fg-muted/15 p-4 onload-animation anim-delay-50"
    >
      <p class="text-fg text-sm font-medium">
        {{ t("views.forgotPassword.unavailable.stepsTitle") }}
      </p>

      <ol class="flex flex-col gap-2 text-fg-subtle text-sm list-decimal pl-5">
        <li>{{ t("views.forgotPassword.unavailable.step1") }}</li>
        <li>
          {{ t("views.forgotPassword.unavailable.step2") }}
          <div class="mt-2 flex flex-col gap-2">
            <div
              v-for="command in COMMANDS"
              :key="command.key"
            >
              <TipInput
                :model-value="command.value"
                :label="t(`views.forgotPassword.unavailable.${command.key}`)"
                readonly
              />
            </div>
          </div>
        </li>
        <li>{{ t("views.forgotPassword.unavailable.step3") }}</li>
      </ol>

      <p class="text-fg-subtle text-xs">
        {{ t("views.forgotPassword.unavailable.twoFactorHint") }}
      </p>
    </div>

    <!-- 另一条路：配好邮件服务 -->
    <p class="text-fg-subtle text-xs onload-animation anim-delay-100">
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
