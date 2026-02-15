// src/stores/setup.store.ts
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useLang } from "@/composables/lang.hook";

/** Step5 SMTP 表单校验函数类型 */
type SmtpFormValidator = (() => boolean) | null;

export const useSetupStore = defineStore("setup", () => {
  const { t } = useLang();

  /**
   * Step1~Step5 的进度标题国际化键。
   *
   * 顺序必须与实际步骤组件顺序一致：
   * 1. Step1 外观
   * 2. Step2 站点信息
   * 3. Step3 管理员账号
   * 4. Step4 个性化
   * 5. Step5 SMTP
   */
  const progressTitleKeys = [
    "stores.setup.progress.step1",
    "stores.setup.progress.step2",
    "stores.setup.progress.step3",
    "stores.setup.progress.step4",
    "stores.setup.progress.step5",
  ];

  /** 当前步骤标题（由 currentStep 动态映射） */
  const currentTitle = computed(() =>
    t(progressTitleKeys[currentStep.value - 1]!),
  );

  /**
   * 当前步骤索引（1-based）。
   * 用于决定渲染哪个步骤组件以及顶部进度条展示。
   */
  const currentStep = ref(1);

  /** 总步骤数（当前为 5 步） */
  const totalSteps = progressTitleKeys.length;

  /**
   * Step3：管理员是否已注册。
   *
   * 用途：
   * - 当用户从后续步骤返回 Step3 时，避免重复注册。
   * - 已注册后可直接 next，减少重复接口请求。
   */
  const isAdminRegistered = ref(false);

  /**
   * Step3：管理员注册表单。
   * 字段与 Step3 页面输入项一一对应。
   */
  const adminForm = ref({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  /**
   * Step4：是否启用个性化。
   *
   * 用途：
   * - 控制个性化上传区域是否展开。
   * - 控制左侧展示区是否由 Logo 切换为个性化内容。
   */
  const isPersonalized = ref(false);

  /**
   * Step5：是否启用 SMTP。
   *
   * 用途：
   * - 控制 SMTP 表单显示/隐藏。
   * - 控制左侧展示区是否由 Logo 切换为 SMTP 表单。
   */
  const isSMTPEnabled = ref(false);

  /**
   * Step5：是否已展开高级 SMTP 选项。
   *
   * 用途：
   * - 控制 senderEmail / senderName 两个高级字段的显示。
   * - 决定高级字段是否必填（展开时必填，收起时不校验）。
   * - 放在 store 中以跨布局保持状态，避免桌面/移动端切换时被重置。
   */
  const isSMTPAdvancedExpanded = ref(false);

  /**
   * Step5：SMTP 表单数据。
   * 字段与 SMTPForm 组件输入项一一对应。
   */
  const smtpForm = ref({
    host: "",
    port: 587,
    username: "",
    password: "",
    senderEmail: "",
    senderName: "",
  });

  /**
   * Step5 表单校验器（单实例）。
   *
   * 约束：
   * - 通过布局控制，任意时刻只挂载一个 SMTPForm。
   * - 因此只需保留一个校验器引用即可。
   */
  const smtpFormValidator = ref<SmtpFormValidator>(null);

  /** 注册/替换当前 SMTP 表单校验器 */
  function setSmtpFormValidator(validator: SmtpFormValidator) {
    smtpFormValidator.value = validator;
  }

  /**
   * 执行 Step5 SMTP 表单校验。
   *
   * - 仅在启用 SMTP 时由 Step5 调用。
   * - 若未注册校验器，默认返回 false，避免误放行。
   */
  function validateSmtpForm() {
    return smtpFormValidator.value?.() ?? false;
  }

  /** 前进到下一步（不超过总步骤数） */
  function next() {
    if (currentStep.value < totalSteps) currentStep.value++;
  }

  /** 返回上一步（不低于第一步） */
  function prev() {
    if (currentStep.value > 1) currentStep.value--;
  }

  return {
    currentStep,
    totalSteps,
    currentTitle,
    isAdminRegistered,
    adminForm,
    isPersonalized,
    isSMTPEnabled,
    isSMTPAdvancedExpanded,
    smtpForm,
    setSmtpFormValidator,
    validateSmtpForm,
    next,
    prev,
  };
});
