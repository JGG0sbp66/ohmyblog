<!-- src/views/admin/pages/posts/PostEditor.page.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import BaseCard from "@/components/base/card/BaseCard.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import Loading from "@/components/common/item/Loading.vue";
import PostEditorStatusBar from "@/views/admin/components/posts/editor/PostEditorStatusBar.vue";
import PostEditorContent from "@/views/admin/components/posts/editor/PostEditorContent.vue";
import PostEditorSettingsPanel from "@/views/admin/components/posts/editor/PostEditorSettingsPanel.vue";
import PostEditorSettingsForm from "@/views/admin/components/posts/editor/setting/PostEditorSettingsForm.vue";
import { usePostEditor } from "@/composables/post-editor.hook";
import { useIsMobile } from "@/composables/breakpoint.hook";
import ConfirmModal from "@/components/base/pop/ConfirmModal.vue";
import BaseSheet from "@/components/base/pop/BaseSheet.vue";
import { useLang } from "@/composables/lang.hook";

const { t } = useLang();
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
  subtitle,
  content,
  contentText,
  contentHtml,
  coverImage,
  coverEnabled,
  excerpt,
  pinned,
  isSaving,
  isDirty,
  isLoaded,
  loadFailed,
  retryLoad,
  save,
  showLeaveConfirm,
  confirmLeave,
  cancelLeave,
} = usePostEditor();

// 手机端默认收起设置，切换回桌面端时恢复常驻面板。
//
// 编辑区的适配现状：
// - 两套菜单按「有没有悬停能力」切换，不按屏幕宽度（见 pointer.hook 的注释）。
//   文本气泡菜单 / 块拖拽手柄 / 表格行列控件都是 hover 或 mousemove 驱动的，
//   纯触屏设备上整组不挂载，能力平移到 MobileEditorToolbar（吸附键盘上沿的
//   常驻工具条 + 「+」插入面板）。窄窗口的桌面浏览器仍然走桌面那套 —— 鼠标可用，
//   气泡菜单本来也做过视口 clamp + 上下翻转；
// - 图片气泡菜单是 NodeSelection 驱动的（点一下图片就选中），两端共用；
// - / 命令面板、有序列表编号菜单、代码块语言下拉走 use-anchored-position，本来就有边界收敛。
watch(isMobile, (mobile) => {
  showSettings.value = !mobile;
});
</script>

<template>
  <BaseCard
    padding="none"
    class="relative flex flex-1 overflow-hidden onload-animation"
  >
    <!-- 加载失败：错误面板 + 重试。编辑器坚决不渲染 —— 空表单配上已武装的
         自动保存，网络恢复后 PATCH 成功就会把原文的标签/副标题/置顶清空 -->
    <div
      v-if="loadFailed"
      class="flex flex-1 flex-col items-center justify-center gap-4 p-8"
    >
      <p class="text-sm text-fg-subtle text-center">
        {{ t("views.admin.PostEditor.loadFailed.message") }}
      </p>
      <ButtonSecondary
        :text="t('views.admin.PostEditor.loadFailed.retry')"
        @click="retryLoad"
      />
    </div>

    <!-- 加载完成前只给 loading。正文区不挂载，加载窗口期的盲打内容就不会
         被自回声判定误保留、随后连着保存一起覆盖原文（与上面同一根因） -->
    <div
      v-else-if="!isLoaded"
      class="flex flex-1 items-center justify-center min-h-[50vh]"
    >
      <Loading size-class="w-6 h-6" color-class="text-fg-subtle" />
    </div>

    <template v-else>
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
          v-model:subtitle="subtitle"
          v-model:content="content"
          v-model:contentText="contentText"
          v-model:contentHtml="contentHtml"
          v-model:total-char-count="totalCharCount"
          v-model:selected-char-count="selectedCharCount"
        />
      </div>

      <!-- 桌面端保留并排侧栏及宽度动画。 -->
      <div
        v-if="!isMobile"
        class="shrink-0 overflow-hidden onload-animation anim-delay-200"
        :style="{
          width: showSettings ? '18rem' : '0',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }"
      >
        <PostEditorSettingsPanel
          :uuid="uuid"
          v-model:slug="slug"
          v-model:tags="tags"
          v-model:status="status"
          v-model:excerpt="excerpt"
          v-model:coverImage="coverImage"
          v-model:cover-enabled="coverEnabled"
          v-model:pinned="pinned"
        />
      </div>

      <!-- 手机端使用 Bottom Sheet，不再复用桌面侧栏的定位、宽度和遮罩逻辑。 -->
      <BaseSheet
        v-if="isMobile"
        v-model="showSettings"
        :title="t('views.admin.PostEditor.settingsPanel.title')"
        :close-label="t('views.admin.PostEditor.settingsPanel.close')"
      >
        <PostEditorSettingsForm
          :uuid="uuid"
          v-model:slug="slug"
          v-model:tags="tags"
          v-model:status="status"
          v-model:excerpt="excerpt"
          v-model:cover-image="coverImage"
          v-model:cover-enabled="coverEnabled"
          v-model:pinned="pinned"
          class="pb-4"
        />
      </BaseSheet>
    </template>

    <!-- 有未保存内容时离开本页的确认弹窗，由 usePostEditor 的路由守卫驱动。
         关闭弹窗（遮罩 / ESC）等同于取消，守卫必须拿到结果才会放行 -->
    <ConfirmModal
      :model-value="showLeaveConfirm"
      icon-class="text-red-500"
      :title="t('views.admin.PostEditor.leaveConfirm.title')"
      :question="t('views.admin.PostEditor.leaveConfirm.question')"
      :warning="t('views.admin.PostEditor.leaveConfirm.warning')"
      :confirm-text="t('views.admin.PostEditor.leaveConfirm.confirm')"
      confirm-class="bg-red-500 hover:bg-red-600"
      @update:model-value="cancelLeave"
      @confirm="confirmLeave"
    />
  </BaseCard>
</template>
