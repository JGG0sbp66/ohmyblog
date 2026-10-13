<!-- src/components/base/card/SettingCard.vue -->
<script setup lang="ts">
import BaseCard from "./BaseCard.vue";

/**
 * 设置卡片组件
 * 基于 BaseCard，提供标题、描述和内容区域的标准布局
 * 可用于初始化流程、后台管理设置等场景
 */
interface Props {
  /**
   * 卡片标题
   */
  title?: string;

  /**
   * 卡片描述/副标题
   */
  description?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <BaseCard class="flex flex-col gap-8">
    <!-- 头部区域：标题和描述 -->
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-bold text-fg">
        <slot name="title">{{ title }}</slot>
      </h2>
      <p
        v-if="description || $slots.description"
        class="text-fg-subtle text-sm"
      >
        <slot name="description">{{ description }}</slot>
      </p>
    </div>

    <!-- 内容区域：表单、选择器等 -->
    <div class="flex flex-col gap-8">
      <slot />
    </div>

    <!-- 底部区域：按钮、操作等（可选） -->
    <!--
      TODO(统一设置卡保存按钮)：目前五个设置组的保存按钮各写各的，不一致——
      ① 界面外观/站点信息/管理员信息 三组把 ButtonPrimary 放在 #footer 且不加宽度
         class，手机端是右下角小按钮；
      ② SMTP/人机验证 两组把按钮写在默认插槽的内容流里、带 w-full sm:w-auto px-8
         （手机端通栏），还因 enabled/disabled 分支重复了两份完全相同的按钮。

      目标：在 SettingCard 内置一个 opt-in 的默认保存按钮（新增 saveText / saving
      prop + @save 事件），样式统一为 w-full sm:w-auto px-8（手机端通栏更好点），
      通过下面 #footer 插槽的 fallback + v-if="saveText" 双闸门渲染：自带 #footer 的
      使用方（StepLayout 向导按钮、FriendLinkApplyForm 原生 submit）和不传 saveText
      的使用方（SystemInfoCard 检查更新的双按钮）都不受影响，天然 opt-out。

      迁移范围（共 15 个真实使用方，Friends.page 仅注释提及不算）：
      - A 组 7 个设置表单（AppearanceForm / AnnouncementForm / SiteInfoForm /
        HeroSettingsForm / FooterSettingsForm / AdminProfileCard / AccountSecurityCard）
        删掉各自的 #footer，改传 saveText + @save；仪表盘 QuickNoteCard 是否一并统一待定。
      - B 组 SMTPSettingsForm / CaptchaConfigCard / CaptchaEntriesCard 把内联且重复的
        按钮收进 footer，顺带去重、位置稳定、并脱离 parentRef 的 auto-animate（切换开关
        时按钮不再跟着重排）。EmailSendCard 是「发送测试邮件」语义，非保存，可不动。

      注意：卡片是内容高度（BaseCard 无 h-full/min-h，footer 无 mt-auto），把按钮挪进
      footer 不会让它沉到可视区底部，只是结构统一 + 紧跟内容；若将来要「操作栏吸底」
      需另做卡片撑高 + mt-auto，且短表单会留大片空白，暂不纳入。
    -->
    <slot name="footer" />
  </BaseCard>
</template>
