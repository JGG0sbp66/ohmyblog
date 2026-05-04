<!-- src/views/admin/components/posts/table/cells/PostRowActions.vue -->
<!--
  文章列表行操作区域
  - 编辑按钮：直接 emit('edit')，由父组件处理路由跳转
  - 删除按钮：根据文章当前状态分两种操作，均通过内置弹窗二次确认后再调用接口
      · 非回收站文章 → 移入回收站（软删除，可恢复）
      · 回收站文章   → 永久删除（硬删除，不可恢复）
  - 操作完成后 emit('refresh')，父组件刷新列表和计数
-->
<script setup lang="ts">
import { ref, computed } from "vue";
import { RiQuillPenLine } from "@remixicon/vue";
import { Trash2, TriangleAlert } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import ConfirmModal from "@/components/base/pop/ConfirmModal.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import DeleteButton from "@/components/common/button/DeleteButton.vue";
import { updatePostStatus, permanentDeletePost } from "@/api/post.api";
import type { PostListItem } from "@/api/post.api";

const props = defineProps<{
  post: PostListItem;
}>();

const emit = defineEmits<{
  /** 点击编辑按钮，由父组件负责跳转 */
  edit: [];
  /** 操作执行成功，通知父组件刷新列表 */
  refresh: [];
}>();

const { t } = useLang();

// ─── 状态计算 ────────────────────────────────────────────────────────────────

/**
 * 是否为永久删除模式
 * 业务逻辑：如果文章已在回收站，则触发永久删除弹窗
 */
const isPermanentDelete = computed(() => props.post.status === "deleted");

// ─── 弹窗状态 ────────────────────────────────────────────────────────────────

/** 确认弹窗是否显示 */
const showConfirm = ref(false);
/** 防止按钮连续点击 */
const loading = ref(false);

// ─── 操作逻辑 ────────────────────────────────────────────────────────────────

/**
 * 执行确认后的删除操作
 * 根据 isPermanentDelete 决定调用物理删除还是移入回收站
 */
const handleConfirm = async () => {
  loading.value = true;
  try {
    if (isPermanentDelete.value) {
      await permanentDeletePost(props.post.uuid);
    } else {
      await updatePostStatus(props.post.uuid, "deleted");
    }
    showConfirm.value = false;
    emit("refresh");
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    loading.value = false;
  }
};

/** 显示用的标题，无标题时用占位文案 */
const postTitle = () =>
  props.post.title || t("views.admin.Posts.table.untitled");
</script>

<template>
  <!-- 操作按钮区：阻止点击冒泡，避免触发行的路由跳转 -->
  <div class="w-20 shrink-0 flex items-center justify-end gap-1" @click.stop>
    <!-- 编辑按钮 -->
    <ButtonSecondary
      class="w-8! h-8! p-0! text-fg-subtle hover:text-accent"
      :title="t('views.admin.Posts.table.actions.edit')"
      @click="emit('edit')"
    >
      <RiQuillPenLine class="w-3.5 h-3.5" />
    </ButtonSecondary>

    <!-- 删除按钮：tooltip 随状态变化 -->
    <DeleteButton
      class="w-8! h-8!"
      :title="
        isPermanentDelete
          ? t('views.admin.Posts.table.actions.permanentDelete')
          : t('views.admin.Posts.table.actions.trash')
      "
      @click="showConfirm = true"
    />
  </div>

  <!-- 删除/移入回收站确认弹窗 -->
  <ConfirmModal
    v-model="showConfirm"
    :icon="isPermanentDelete ? TriangleAlert : Trash2"
    :title="
      isPermanentDelete
        ? t('views.admin.Posts.table.confirm.delete.title')
        : t('views.admin.Posts.table.confirm.trash.title')
    "
    :question="
      isPermanentDelete
        ? t('views.admin.Posts.table.confirm.delete.question', {
            title: postTitle(),
          })
        : t('views.admin.Posts.table.confirm.trash.question', {
            title: postTitle(),
          })
    "
    :warning="
      isPermanentDelete
        ? t('views.admin.Posts.table.confirm.delete.warning')
        : t('views.admin.Posts.table.confirm.trash.warning')
    "
    :confirm-text="
      isPermanentDelete
        ? t('views.admin.Posts.table.confirm.delete.confirm')
        : t('views.admin.Posts.table.confirm.trash.confirm')
    "
    :confirm-class="isPermanentDelete ? 'bg-red-500! hover:bg-red-600!' : ''"
    :loading="loading"
    @confirm="handleConfirm"
  />
</template>
