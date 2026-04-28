<!-- src/views/admin/components/settings/site/FooterSettingsForm.vue -->
<script setup lang="ts">
import { ref } from "vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ListEditorLayout from "@/components/common/list/ListEditorLayout.vue";
import KeyValueListEditor from "@/components/common/list/KeyValueListEditor.vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import { useToast } from "@/composables/toast.hook";
import { upsertConfig } from "@/api/config.api";
import { useListEditor } from "@/composables/list-editor.hook";

// --- 基础状态与 Hook ---
const { t } = useLang();
const systemStore = useSystemStore();
const isSubmitting = ref(false); // 保存状态加载锁

/** 每页显示的链接条数 */
const PAGE_SIZE = 5;

/**
 * 列表管理核心逻辑 (Hook)
 * 负责处理本地带 ID 的 items 数组、分页计算、增删跳转以及自动同步回 Store
 */
const {
  items,
  currentPage,
  totalPages,
  pagedRows,
  addItem: addLink,
  removeItem: removeRow,
  updateItem,
} = useListEditor({
  // 数据源：Store 里的页脚链接原始数组
  initialSource: systemStore.siteInfo.footerLinks,
  pageSize: PAGE_SIZE,
  // 转换：业务 Body 即为原始对象本身，Hook 会自动注入渲染所需的 ID
  mapToLocal: (link) => link,
  mapToRemote: (body) => body,
  // 同步：本地变化时即时更新 Store (Hook 已自动剥离 ID)
  onSync: (newLinks) => {
    systemStore.siteInfo.footerLinks = newLinks;
  },
  // 工厂：新增行时的默认业务数据
  newItemFactory: () => ({ name: "", url: "" }),
});

/**
 * 更新特定 ID 的链接信息
 * 由于 KeyValueListEditor 触发时传回多个参数，这里做一层简单的适配转发
 */
const updateRow = (id: string, name: string, url: string) => {
  updateItem(id, { name, url });
};

/**
 * 提交保存：将整个 site_info 配置持久化到后端
 */
const handleSave = async () => {
  isSubmitting.value = true;
  try {
    await upsertConfig({
      configKey: "site_info",
      configValue: systemStore.siteInfo,
    });
    useToast.success(t("api.success.保存成功"));
  } catch (error) {
    // 错误处理已由 API 层自动拦截并弹出 Toast
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <SettingCard
    class="w-full lg:w-120"
    :title="t('views.admin.Settings.site.footer.title')"
    :description="t('views.admin.Settings.site.footer.description')"
  >
    <div class="flex flex-col gap-8">
        <!-- 1. 版权文本 -->
        <TipInput
          v-model="systemStore.siteInfo.footer"
          :label="t('views.setup.steps.step2.footer.label')"
          :placeholder="t('views.setup.steps.step2.footer.placeholder')"
          :hint="t('views.setup.steps.step2.footer.hint')"
        />

        <!-- 2. 备案号 -->
        <TipInput
          v-model="systemStore.siteInfo.icp"
          :label="t('views.setup.steps.step2.icp.label')"
          :placeholder="t('views.setup.steps.step2.icp.placeholder')"
          :hint="t('views.setup.steps.step2.icp.hint')"
        />

        <!-- 3. 页脚链接 -->
        <ListEditorLayout
          :title="t('views.admin.Settings.site.footer.links.title')"
          :count="items.length"
          :add-text="t('views.admin.Settings.site.footer.links.add')"
          :show-pagination="items.length > PAGE_SIZE"
          :current-page="currentPage"
          :total-pages="totalPages"
          @add="addLink"
          @update:current-page="currentPage = $event"
        >
          <KeyValueListEditor
            :items="pagedRows"
            :page-key="currentPage"
            :key-placeholder="
              t('views.admin.Settings.site.footer.links.namePlaceholder')
            "
            :value-placeholder="
              t('views.admin.Settings.site.footer.links.urlPlaceholder')
            "
            @update="updateRow"
            @remove="removeRow"
          />
        </ListEditorLayout>
      </div>

      <template #footer>
        <div class="flex justify-end pt-4">
          <ButtonPrimary
            :text="t('common.save')"
            :loading="isSubmitting"
            @click="handleSave"
            class="min-w-32"
          />
        </div>
      </template>
    </SettingCard>
</template>

<style scoped></style>
