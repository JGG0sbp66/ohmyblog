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
import { ref } from "vue";
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

// ─── 弹窗状态 ────────────────────────────────────────────────────────────────

/** 移入回收站确认弹窗是否显示 */
const showTrashConfirm = ref(false);
/** 永久删除确认弹窗是否显示 */
const showDeleteConfirm = ref(false);
/** 防止按钮连续点击 */
const loading = ref(false);

// ─── 删除按钮点击入口 ────────────────────────────────────────────────────────

/** 根据文章状态决定弹出哪个确认弹窗 */
const handleDeleteClick = () => {
  if (props.post.status === "deleted") {
    showDeleteConfirm.value = true;
  } else {
    showTrashConfirm.value = true;
  }
};

// ─── 确认操作 ────────────────────────────────────────────────────────────────

/** 确认移入回收站 */
const confirmTrash = async () => {
  loading.value = true;
  try {
    await updatePostStatus(props.post.uuid, "deleted");
    showTrashConfirm.value = false;
    emit("refresh");
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    loading.value = false;
  }
};

/** 确认永久删除 */
const confirmDelete = async () => {
  loading.value = true;
  try {
    await permanentDeletePost(props.post.uuid);
    showDeleteConfirm.value = false;
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
        post.status === 'deleted'
          ? t('views.admin.Posts.table.actions.permanentDelete')
          : t('views.admin.Posts.table.actions.trash')
      "
      @click="handleDeleteClick"
    />
  </div>

  <!-- 移入回收站确认弹窗（可恢复） -->
  <ConfirmModal
    v-model="showTrashConfirm"
    :icon="Trash2"
    :title="t('views.admin.Posts.table.confirm.trash.title')"
    :question="t('views.admin.Posts.table.confirm.trash.question', { title: postTitle() })"
    :warning="t('views.admin.Posts.table.confirm.trash.warning')"
    :confirm-text="t('views.admin.Posts.table.confirm.trash.confirm')"
    :loading="loading"
    @confirm="confirmTrash"
  />

  <!-- 永久删除确认弹窗（不可恢复，红色警示） -->
  <ConfirmModal
    v-model="showDeleteConfirm"
    :icon="TriangleAlert"
    :title="t('views.admin.Posts.table.confirm.delete.title')"
    :question="t('views.admin.Posts.table.confirm.delete.question', { title: postTitle() })"
    :warning="t('views.admin.Posts.table.confirm.delete.warning')"
    :confirm-text="t('views.admin.Posts.table.confirm.delete.confirm')"
    :loading="loading"
    confirm-class="bg-red-500! hover:bg-red-600!"
    @confirm="confirmDelete"
  />
</template>
