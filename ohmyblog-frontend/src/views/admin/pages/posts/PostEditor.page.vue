<!-- src/views/admin/pages/posts/PostEditor.page.vue -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseCard from "@/components/base/card/BaseCard.vue";
import PostEditorStatusBar from "@/views/admin/components/posts/editor/PostEditorStatusBar.vue";
import PostEditorContent from "@/views/admin/components/posts/editor/PostEditorContent.vue";
import PostEditorSettingsPanel from "@/views/admin/components/posts/editor/PostEditorSettingsPanel.vue";
import { usePostEditor } from "@/composables/post-editor.hook";
import { useIsMobile } from "@/composables/breakpoint.hook";

// TODO [风险5 - 无离开页面保护]: 未发现 onBeforeRouteLeave 或 window.beforeunload 守卫。
//   若 isDirty 为 true（有未保存内容）或 isSaving 为 true（保存进行中）时用户关闭页面或切换路由，
//   当前编辑内容将无声丢失。
//   修复方向：在此处或 usePostEditor 内添加 onBeforeRouteLeave，当 isDirty 为 true 时
//   弹出确认对话框；同时注册 window.addEventListener('beforeunload', ...) 防止浏览器关闭。
const isMobile = useIsMobile();
const showSettings = ref(!isMobile.value);
const totalCharCount = ref(0);
const selectedCharCount = ref(0);
const {
  uuid,
  slug,
  tags,
  status,
  title,
  content,
  contentText,
  contentHtml,
  coverImage,
  excerpt,
  pinned,
  isSaving,
  isDirty,
  save,
} = usePostEditor();

const settingsPanelStyle = computed(() => ({
  width: showSettings.value
    ? isMobile.value
      ? "min(18rem, 100%)"
      : "18rem"
    : "0",
  transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
}));

// 手机端默认收起设置，切换回桌面端时恢复常驻面板。
// TODO [风险8 - 移动端布局]: settingsPanelStyle 在桌面端固定 18rem，手机端已有覆盖式抽屉，
//   但编辑区域本身（PostEditorContent / PostEditorBody）目前没有针对小屏的专项调整，
//   气泡菜单、块拖拽手柄和表格控件在窄屏下的点击区域和浮层定位可能存在遮挡或溢出问题。
//   修复方向：在各菜单子组件里加入宽度断点判断，或为 < 768px 场景做专属精简工具栏。
watch(isMobile, (mobile) => {
  showSettings.value = !mobile;
});
</script>

<template>
  <BaseCard
    padding="none"
    class="relative flex flex-1 overflow-hidden onload-animation"
  >
    <!-- 左侧编辑区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <PostEditorStatusBar
        class="onload-animation anim-delay-100"
        :settingsOpen="showSettings"
        :loading="isSaving"
        :isDirty="isDirty"
        :totalCharCount="totalCharCount"
        :selectedCharCount="selectedCharCount"
        @toggle-settings="showSettings = !showSettings"
        @save="save"
      />
      <PostEditorContent
        class="onload-animation anim-delay-150"
        v-model:title="title"
        v-model:content="content"
        v-model:contentText="contentText"
        v-model:contentHtml="contentHtml"
        v-model:total-char-count="totalCharCount"
        v-model:selected-char-count="selectedCharCount"
      />
    </div>

    <!-- 手机端使用覆盖式抽屉，避免设置面板挤压正文编辑区域。 -->
    <div
      v-if="isMobile && showSettings"
      class="absolute inset-0 z-20 bg-black/40"
      aria-hidden="true"
      @click="showSettings = false"
    />

    <!-- 桌面端为并排侧栏；手机端定位到右侧作为抽屉。 -->
    <div
      class="shrink-0 overflow-hidden onload-animation anim-delay-200"
      :class="{
        'absolute inset-y-0 right-0 z-30 shadow-2xl': isMobile,
      }"
      :style="settingsPanelStyle"
    >
      <PostEditorSettingsPanel
        :uuid="uuid"
        v-model:slug="slug"
        v-model:tags="tags"
        v-model:status="status"
        v-model:excerpt="excerpt"
        v-model:coverImage="coverImage"
        v-model:pinned="pinned"
        @close="showSettings = false"
      />
    </div>
  </BaseCard>
</template>
