<!-- src/views/admin/components/posts/editor/PostEditorStatusBar.vue -->
<script setup lang="ts">
import { Settings } from "lucide-vue-next";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import PageToolbar from "@/views/admin/components/posts/layout/PageToolbar.vue";
import { useLang } from "@/composables/lang.hook";

/**
 * PostEditorStatusBar — 文章编辑器顶部状态栏
 *
 * Props:
 * - settingsOpen: 右侧设置面板是否展开，用于同步设置按钮激活态
 *
 * Emits:
 * - toggleSettings: 点击设置按钮时触发，由父组件控制面板开合
 * - save: 点击保存按钮时触发
 */
const { t } = useLang();

defineProps<{
  settingsOpen: boolean;
}>();

const emit = defineEmits<{
  toggleSettings: [];
  save: [];
}>();
</script>

<template>
  <PageToolbar>
    <template #left>
      <!-- 状态标签 -->
      <div class="flex items-center gap-2">
        <!-- 保存状态标签：未保存 / 已保存等 -->
        <BaseTag size="sm" type="warn">{{ t('views.admin.PostEditor.statusBar.unsaved') }}</BaseTag>
      </div>
    </template>
    <template #right>
      <!-- 操作按钮 -->
      <div class="flex items-center gap-2">
        <!-- 设置按钮 -->
        <div class="w-9 h-9">
          <ButtonSecondary
            class="w-full h-full"
            :isActive="settingsOpen"
            @click="emit('toggleSettings')"
          >
            <Settings class="w-5 h-5" />
          </ButtonSecondary>
        </div>

        <!-- 保存按钮 -->
        <ButtonPrimary
          :text="t('views.admin.PostEditor.statusBar.save')"
          class="text-sm"
          @click="emit('save')"
        />
      </div>
    </template>
  </PageToolbar>
</template>
