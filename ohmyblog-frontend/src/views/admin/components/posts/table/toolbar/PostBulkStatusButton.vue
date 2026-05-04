<!-- src/views/admin/components/posts/table/toolbar/PostBulkStatusButton.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { ListRestart, MoveRight } from "lucide-vue-next";
import BaseTag from "@/components/base/tag/BaseTag.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ConfirmListModal from "@/components/base/pop/ConfirmListModal.vue";
import SegmentedControl from "@/components/base/control/SegmentedControl.vue";
import ConfirmItemRow from "@/components/common/list/ConfirmItemRow.vue";
import { useLang } from "@/composables/lang.hook";
import { useToast } from "@/composables/toast.hook";
import { updatePostStatus } from "@/api/post.api";
import type { PostListItem } from "@/api/post.api";
import type { TPostStatus } from "@server/db/constants/post.constants";
import {
  POST_STATUS_COLORS,
  POST_STATUS_LABEL_KEYS,
} from "../cells/PostStatusBadge.vue";

const props = defineProps<{
  selectedPosts: PostListItem[];
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const { t } = useLang();
const showModal = ref(false);
const loading = ref(false);

/** 目标状态，默认为 published */
const targetStatus = ref<TPostStatus>("published");

/** 状态选项列表 */
const statusOptions = computed(() =>
  (["published", "draft", "archived", "deleted"] as TPostStatus[]).map((s) => ({
    value: s,
    label: getStatusLabel(s),
  })),
);

/** 获取状态对应的翻译文案 */
const getStatusLabel = (s: TPostStatus) => t(POST_STATUS_LABEL_KEYS[s]);

/** 转换列表数据为弹窗展示格式 */
const items = computed(() =>
  props.selectedPosts.map((p) => ({
    key: p.uuid,
    label: p.title || t("views.admin.Posts.table.untitled"),
    tag: getStatusLabel(p.status),
    tagClass: POST_STATUS_COLORS[p.status],
  })),
);

/** 执行批量状态修改 */
const handleConfirm = async () => {
  loading.value = true;
  try {
    await Promise.all(
      props.selectedPosts.map((post) =>
        updatePostStatus(post.uuid, targetStatus.value),
      ),
    );
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
    class="text-sm"
    :text="t('views.admin.Posts.table.bulk.changeStatus')"
    @click="showModal = true"
  />

  <ConfirmListModal
    v-model="showModal"
    :icon="ListRestart"
    :title="t('views.admin.Posts.table.bulk.statusModal.title')"
    :question="t('views.admin.Posts.table.bulk.statusModal.question')"
    :confirm-text="
      t('views.admin.Posts.table.bulk.statusModal.confirm', {
        status: getStatusLabel(targetStatus),
      })
    "
    :loading="loading"
    :items="items"
    @confirm="handleConfirm"
  >
    <!-- Segmented Control (Apple / Linear 风格) -->
    <div class="my-4">
      <SegmentedControl v-model="targetStatus" :options="statusOptions" />
    </div>

    <!-- 自定义列表项：实现 [旧状态标签 -> 新状态标签] 预览 -->
    <template #item="{ item, index }">
      <ConfirmItemRow :index="index" :label="item.label">
        <!-- 旧状态 -->
        <BaseTag
          :show-icon="false"
          class="text-[10px] px-1.5 py-0.5 opacity-60 line-through decoration-fg-soft/50"
          :class="item.tagClass"
        >
          {{ item.tag }}
        </BaseTag>

        <MoveRight class="w-3 h-3 text-fg-subtle" />

        <!-- 新状态 -->
        <BaseTag
          :show-icon="false"
          class="text-[10px] px-1.5 py-0.5 font-bold"
          :class="POST_STATUS_COLORS[targetStatus]"
        >
          {{ getStatusLabel(targetStatus) }}
        </BaseTag>
      </ConfirmItemRow>
    </template>
  </ConfirmListModal>
</template>
