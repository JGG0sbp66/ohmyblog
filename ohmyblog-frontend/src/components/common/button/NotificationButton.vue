<!-- src/components/common/button/NotificationButton.vue -->
<!--
TODO: NotificationButton 组件待完善功能
1. [数据获取] 从后端 API 获取通知列表数据
2. [通知类型] 支持不同类型的通知（评论、系统消息等）
3. [未读标记] 显示未读通知数量的红点徽章
4. [交互功能] 点击通知项跳转到对应页面
5. [标记已读] 支持标记单个或全部通知为已读
6. [分页加载] 通知列表过多时支持分页或无限滚动
-->
<script lang="ts" setup>
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import BellIcon from "@/components/icon/ui/Bell.vue";
import DropButton from "@/components/common/button/DropButton.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();
</script>

<template>
  <DropButton
    :contentClass="'flex flex-col gap-4 min-w-80 p-4'"
    placement="-left-60"
  >
    <template #trigger="{ active }">
      <ButtonSecondary :isActive="active" class="w-full h-full">
        <BellIcon />
      </ButtonSecondary>
    </template>

    <template #content>
      <div class="flex flex-col gap-3">
        <!-- 标题 -->
        <div class="flex items-center justify-between">
          <span class="text-fg font-bold text-lg">{{
            t("components.common.button.NotificationButton.title")
          }}</span>
        </div>

        <!-- 空状态提示 -->
        <!-- TODO: 替换为实际的通知列表 -->
        <div
          class="flex flex-col items-center justify-center py-8 text-fg-subtle"
        >
          <span class="text-sm">{{
            t("components.common.button.NotificationButton.empty")
          }}</span>
        </div>
      </div>
    </template>
  </DropButton>
</template>
