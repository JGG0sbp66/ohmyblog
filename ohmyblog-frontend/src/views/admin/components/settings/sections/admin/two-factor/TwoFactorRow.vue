<!-- src/views/admin/components/settings/sections/admin/TwoFactorRow.vue -->
<!--
  账号安全卡片里的「两步验证」模块项。

  使用 ModuleItem（toggle 开关样式），toggle 切换时弹出对应弹窗：
  - 关 → 开：弹出启用向导 (TwoFactorSetupModal)
  - 开 → 关：弹出关闭确认 (ConfirmModal，需要密码)

  弹窗取消或失败时 toggle 回退到原状态，确保视觉状态始终与后端一致。
-->
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import ModuleItem from "@/components/common/item/ModuleItem.vue";
import ConfirmModal from "@/components/base/pop/ConfirmModal.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import TwoFactorSetupModal from "./TwoFactorSetupModal.vue";
import TwoFactorRecoveryCodesModal from "./TwoFactorRecoveryCodesModal.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { disableTwoFactor, getTwoFactorStatus } from "@/api/two-factor.api";
import { TwoFactorDisableDTO } from "@server/dtos/two-factor.dto";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";

const { t } = useLang();

// 开关状态变化引起的内容展开/收起动画，与 SMTP 设置保持一致
const [rowRef] = useAutoAnimate();

type TwoFactorStatus = Awaited<ReturnType<typeof getTwoFactorStatus>>;

const status = ref<TwoFactorStatus | null>(null);
const isLoading = ref(true);

// toggle 的绑定值，与后端状态同步
const enabled = ref(false);

// 代码回退 toggle 时置 true，防止 watch 误触发弹窗
const isReverting = ref(false);

// 弹窗开关
const showSetup = ref(false);
const showRecoveryCodes = ref(false);
const showDisable = ref(false);

// 关闭两步验证需要的密码
const disablePassword = ref("");
const disablePasswordRef = ref<any>(null);
const isDisabling = ref(false);

/** 拉取当前状态 */
const loadStatus = async () => {
  // 同步期间置 true，让 sync watch 能识别出 enabled 的变化不是用户操作；
  // 否则例如关闭成功后 true → false 的同步会误弹关闭确认弹窗
  isLoading.value = true;
  try {
    status.value = await getTwoFactorStatus();
    enabled.value = status.value?.enabled ?? false;
  } catch {
    status.value = null;
    enabled.value = false;
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadStatus);

/**
 * 监听 toggle 变化，弹出对应弹窗。
 * 注意：不在这里直接修改后端状态，只弹弹窗。
 *
 * 必须用 flush: "sync"：默认的 pre 时机下回调会推迟到微任务，
 * 那时 loadStatus 的 finally 已经把 isLoading 置回 false，
 * 初始化同步 enabled（false → true）就会被误判成用户操作，
 * 凭空弹出启用向导并触发 setup 请求。
 */
watch(
  enabled,
  (newVal, oldVal) => {
    // 初始化或 loadStatus 同步时跳过
    if (isLoading.value) return;

    // 代码回退 toggle 时跳过，不弹弹窗
    if (isReverting.value) {
      isReverting.value = false;
      return;
    }

    if (newVal && !oldVal) {
      // 关 → 开：弹出启用向导
      showSetup.value = true;
    } else if (!newVal && oldVal) {
      // 开 → 关：弹出关闭确认
      showDisable.value = true;
    }
  },
  { flush: "sync" },
);

/** 启用成功：刷新状态 */
const handleEnabled = () => {
  loadStatus();
};

/** 启用弹窗关闭：如果未成功启用则回退 toggle */
const handleSetupClose = (open: boolean) => {
  showSetup.value = open;
  if (!open && !status.value?.enabled) {
    // 用户取消了，回退 toggle
    isReverting.value = true;
    enabled.value = false;
  }
};

/** 关闭两步验证 */
const handleDisable = async () => {
  if (!disablePasswordRef.value?.validate()) return;

  isDisabling.value = true;
  try {
    await disableTwoFactor({ password: disablePassword.value });
    useToast.success(t("api.success.两步验证已关闭"));
    showDisable.value = false;
    disablePassword.value = "";
    await loadStatus();
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    isDisabling.value = false;
  }
};

/** 关闭确认弹窗关闭时：如果后端仍然是启用状态，说明用户取消了，回退 toggle */
const handleDisableClose = (open: boolean) => {
  showDisable.value = open;
  if (!open) {
    disablePassword.value = "";
    // 如果后端还是启用的，回退 toggle
    if (status.value?.enabled) {
      isReverting.value = true;
      enabled.value = true;
    }
  }
};
</script>

<template>
  <div ref="rowRef" class="flex flex-col gap-4">
    <ModuleItem
      v-model="enabled"
      :loading="isLoading"
      :title="t('views.admin.Settings.admin.twoFactor.title')"
      :description="t('views.admin.Settings.admin.twoFactor.description')"
    />

    <!-- 已启用时：重新生成恢复码按钮（加载中 status 为 null 不显示，
         加载完成后由 rowRef 的 auto-animate 平滑展开） -->
    <div v-if="status?.enabled" class="flex justify-end">
      <ButtonSecondary
        :text="t('views.admin.Settings.admin.twoFactor.regenerate.action')"
        class="py-2"
        @click="showRecoveryCodes = true"
      />
    </div>

    <!-- 启用向导 -->
    <TwoFactorSetupModal
      :model-value="showSetup"
      @update:model-value="handleSetupClose"
      @enabled="handleEnabled"
    />

    <!-- 重新生成恢复码 -->
    <TwoFactorRecoveryCodesModal
      v-model="showRecoveryCodes"
      @regenerated="loadStatus"
    />

    <!-- 关闭确认：需要密码 -->
    <ConfirmModal
      :model-value="showDisable"
      :title="t('views.admin.Settings.admin.twoFactor.disable.title')"
      :question="t('views.admin.Settings.admin.twoFactor.disable.question')"
      :warning="t('views.admin.Settings.admin.twoFactor.disable.warning')"
      :confirm-text="t('views.admin.Settings.admin.twoFactor.disable.confirm')"
      :loading="isDisabling"
      icon-class="text-red-500"
      confirm-class="bg-red-500! hover:bg-red-600!"
      @confirm="handleDisable"
      @update:model-value="handleDisableClose"
    >
      <TipInput
        ref="disablePasswordRef"
        v-model="disablePassword"
        type="password"
        :label="t('views.admin.Settings.admin.twoFactor.disable.password')"
        :placeholder="
          t('views.admin.Settings.admin.twoFactor.disable.passwordPlaceholder')
        "
        :schema="TwoFactorDisableDTO.properties.password"
        required
      />
    </ConfirmModal>
  </div>
</template>
