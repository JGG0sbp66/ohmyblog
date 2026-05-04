<!-- src/views/admin/components/posts/table/toolbar/PostBulkDeleteButton.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { Trash2, TriangleAlert } from "lucide-vue-next";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ConfirmListModal from "@/components/base/pop/ConfirmListModal.vue";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { updatePostStatus, permanentDeletePost } from "@/api/post.api";
import type { PostListItem } from "@/api/post.api";
import { POST_STATUS_COLORS, POST_STATUS_LABEL_KEYS } from "../cells/PostStatusBadge.vue";

const props = defineProps<{
  selectedPosts: PostListItem[];
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const { t } = useLang();
const showModal = ref(false);
const loading = ref(false);

/** 
 * 是否为永久删除模式
 * 业务逻辑：当选中的文章全部处于回收站状态时，执行物理删除，否则执行移入回收站
 */
const isPermanentDelete = computed(() =>
  props.selectedPosts.every((p) => p.status === "deleted"),
);

/** 
 * 转换列表数据为弹窗展示格式
 */
const items = computed(() =>
  props.selectedPosts.map((p) => ({
    key: p.uuid,
    label: p.title || t("views.admin.Posts.table.untitled"),
    tag: t(POST_STATUS_LABEL_KEYS[p.status]),
    tagClass: POST_STATUS_COLORS[p.status],
  })),
);

/** 
 * 执行批量删除/移入回收站操作
 */
const handleConfirm = async () => {
  loading.value = true;
  try {
    if (isPermanentDelete.value) {
      // 执行永久物理删除
      await Promise.all(
        props.selectedPosts.map((post) => permanentDeletePost(post.uuid)),
      );
    } else {
      // 执行软删除（移入回收站）
      await Promise.all(
        props.selectedPosts.map((post) => updatePostStatus(post.uuid, "deleted")),
      );
    }
    showModal.value = false;
    emit("refresh");
  } catch (error: any) {
    useToast.error(t(`api.errors.${error}`));
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <ButtonPrimary
    class="text-sm bg-red-500 hover:bg-red-600"
    :text="t('views.admin.Posts.table.bulk.delete')"
    @click="showModal = true"
  />

  <ConfirmListModal
    v-model="showModal"
    :icon="isPermanentDelete ? TriangleAlert : Trash2"
    :title="
      isPermanentDelete
        ? t('views.admin.Posts.table.bulk.deleteModal.title')
        : t('views.admin.Posts.table.bulk.trashModal.title')
    "
    :question="
      isPermanentDelete
        ? t('views.admin.Posts.table.bulk.deleteModal.question')
        : t('views.admin.Posts.table.bulk.trashModal.question')
    "
    :warning="
      isPermanentDelete
        ? t('views.admin.Posts.table.bulk.deleteModal.warning')
        : t('views.admin.Posts.table.bulk.trashModal.warning')
    "
    :confirm-text="
      isPermanentDelete
        ? t('views.admin.Posts.table.bulk.deleteModal.confirm')
        : t('views.admin.Posts.table.bulk.trashModal.confirm')
    "
    :confirm-class="isPermanentDelete ? 'bg-red-500! hover:bg-red-600!' : ''"
    :loading="loading"
    :items="items"
    @confirm="handleConfirm"
  />
</template>
