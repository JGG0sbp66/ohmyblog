<!-- src/components/common/button/GroupedDropButton.vue -->
<script setup lang="ts">
import { ref } from "vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import DropButton from "@/components/common/button/DropButton.vue";
import type { Component } from "vue";
import { ChevronDown } from "lucide-vue-next";

/**
 * GroupedDropButton — 带分组下拉菜单的按钮（通用）
 *
 * 内部复用 DropButton（hover 开关 + 桥接层 + BasePop 弹窗）。
 * 点击菜单项后通过 DropButton.close() 主动关闭弹窗。
 * 使用 @mousedown.prevent 防止编辑器失焦。
 *
 * Props:
 * - icon   : 触发按钮图标组件（可选）
 * - groups : 菜单分组，组间自动插入分割线
 *
 * DropdownItem:
 * - label  : 显示文字
 * - icon?  : lucide 图标组件
 * - active : 是否为当前选中项
 * - action : 点击回调
 */
export type DropdownItem = {
  label: string;
  icon?: Component;
  active: boolean;
  action: () => void;
};

const props = defineProps<{
  icon?: Component;
  groups: DropdownItem[][];
}>();

/** 通过 ref 调用 DropButton 暴露的 close() */
const dropRef = ref<InstanceType<typeof DropButton>>();

const runAction = (fn: () => void) => {
  fn();
  dropRef.value?.close();
};
</script>

<template>
  <DropButton
    ref="dropRef"
    trigger-class=""
    pop-offset="mt-3"
    bridge-height="h-3"
  >
    <!-- 触发器 -->
    <template #trigger="{ active }">
      <ButtonSecondary :isActive="active" class="px-1.5 py-1.5">
        <div class="flex items-center gap-0.5 font-medium text-sm">
          <component v-if="icon" :is="icon" class="w-4 h-4" />
          <ChevronDown
            class="w-3.5 h-3.5 opacity-50 shrink-0 transition-transform duration-200"
            :class="{ 'rotate-180': active }"
          />
        </div>
      </ButtonSecondary>
    </template>

    <!-- 内容 -->
    <template #content>
      <div class="flex flex-col gap-1">
        <template v-for="(group, gi) in groups" :key="gi">
          <!-- 分组间分割线 -->
          <div v-if="gi > 0" class="my-1 border-t border-border/30" />

          <ButtonSecondary
            v-for="item in group"
            :key="item.label"
            :isActive="item.active"
            :text="item.label"
            class="w-full justify-start px-3 py-1.5 text-sm"
            @mousedown.prevent="runAction(item.action)"
          >
            <component v-if="item.icon" :is="item.icon" class="w-4 h-4 shrink-0" />
          </ButtonSecondary>
        </template>
      </div>
    </template>
  </DropButton>
</template>
