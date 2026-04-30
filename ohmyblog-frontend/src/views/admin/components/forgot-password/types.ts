// src/views/admin/components/forgot-password/types.ts

/**
 * 忘记密码两步流程共享的表单状态
 * 父页面持有一份，作为 prop 传给两个 step 组件
 */
export interface ForgotPasswordForm {
  email: string;
  code: string;
  newPassword: string;
}
