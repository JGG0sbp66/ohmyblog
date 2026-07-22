<!-- src/views/admin/components/settings/site/FooterSettingsForm.vue -->
<script setup lang="ts">
import { ref } from "vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import { RiAddLine, RiDeleteBinLine, RiArrowDownSLine } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import { useSystemStore } from "@/stores/system.store";
import { useToast } from "@/composables/toast.hook";
import { upsertConfig } from "@/api/config.api";

// --- 基础状态 ---
const { t } = useLang();
const systemStore = useSystemStore();
const isSubmitting = ref(false);

// 当前展开的分组索引 (-1 表示全部收起)
const expandedGroup = ref<number>(0);

const toggleGroup = (index: number) => {
  expandedGroup.value = expandedGroup.value === index ? -1 : index;
};

// --- 分组操作 ---
const addGroup = () => {
  if (!systemStore.siteInfo.footerLinks) {
    systemStore.siteInfo.footerLinks = [];
  }
  systemStore.siteInfo.footerLinks.push({ title: "", links: [] });
  expandedGroup.value = systemStore.siteInfo.footerLinks.length - 1;
};

const removeGroup = (index: number) => {
  systemStore.siteInfo.footerLinks?.splice(index, 1);
  if (expandedGroup.value >= (systemStore.siteInfo.footerLinks?.length ?? 0)) {
    expandedGroup.value = (systemStore.siteInfo.footerLinks?.length ?? 1) - 1;
  }
};

// --- 链接操作 ---
const addLink = (groupIndex: number) => {
  systemStore.siteInfo.footerLinks?.[groupIndex]?.links.push({
    name: "",
    url: "",
  });
};

const removeLink = (groupIndex: number, linkIndex: number) => {
  systemStore.siteInfo.footerLinks?.[groupIndex]?.links.splice(linkIndex, 1);
};

// --- 保存 ---
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
      <!-- 1. 页脚标题 -->
      <TipInput
        v-model="systemStore.siteInfo.footerTitle"
        :label="t('views.admin.Settings.site.footer.footerTitle.label')"
        :placeholder="
          t('views.admin.Settings.site.footer.footerTitle.placeholder')
        "
        :hint="t('views.admin.Settings.site.footer.footerTitle.hint')"
      />

      <!-- 2. 页脚标语 -->
      <TipInput
        v-model="systemStore.siteInfo.footerSlogan"
        :label="t('views.admin.Settings.site.footer.footerSlogan.label')"
        :placeholder="
          t('views.admin.Settings.site.footer.footerSlogan.placeholder')
        "
        :hint="t('views.admin.Settings.site.footer.footerSlogan.hint')"
      />

      <!-- 3. 版权文本 -->
      <TipInput
        v-model="systemStore.siteInfo.footer"
        :label="t('views.setup.steps.step2.footer.label')"
        :placeholder="t('views.setup.steps.step2.footer.placeholder')"
        :hint="t('views.setup.steps.step2.footer.hint')"
      />

      <!-- 4. 备案号 -->
      <TipInput
        v-model="systemStore.siteInfo.icp"
        :label="t('views.setup.steps.step2.icp.label')"
        :placeholder="t('views.setup.steps.step2.icp.placeholder')"
        :hint="t('views.setup.steps.step2.icp.hint')"
      />

      <!-- 5. 页脚分组链接 -->
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h3
            class="text-sm font-bold tracking-wider text-fg-subtle uppercase"
          >
            {{ t("views.admin.Settings.site.footer.links.title") }}
          </h3>
          <ButtonSecondary
            :text="t('views.admin.Settings.site.footer.links.addGroup')"
            size="sm"
            class="group/addbtn shrink-0"
            @click="addGroup"
          >
            <RiAddLine
              class="w-5 h-5 transition-transform duration-300 group-hover/addbtn:rotate-90"
            />
          </ButtonSecondary>
        </div>

        <!-- 分组列表 (手风琴) -->
        <div
          v-if="
            systemStore.siteInfo.footerLinks &&
            systemStore.siteInfo.footerLinks.length > 0
          "
          class="flex flex-col gap-3"
        >
          <div
            v-for="(group, gIndex) in systemStore.siteInfo.footerLinks"
            :key="gIndex"
            class="border border-fg-muted/10 rounded-xl overflow-hidden"
          >
            <!-- 分组头部 -->
            <div
              class="flex items-center justify-between px-4 py-3 bg-bg-muted/30 cursor-pointer select-none hover:bg-bg-muted/50 transition-colors"
              @click="toggleGroup(gIndex)"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <RiArrowDownSLine
                  class="w-4 h-4 text-fg-muted transition-transform duration-200 shrink-0"
                  :class="{ '-rotate-90': expandedGroup !== gIndex }"
                />
                <input
                  v-model="group.title"
                  :placeholder="
                    t(
                      'views.admin.Settings.site.footer.links.groupTitlePlaceholder',
                    )
                  "
                  class="flex-1 min-w-0 bg-transparent text-sm font-medium text-fg outline-none placeholder:text-fg-muted/50"
                  @click.stop
                />
              </div>
              <button
                class="p-1.5 rounded-lg text-fg-muted hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
                @click.stop="removeGroup(gIndex)"
              >
                <RiDeleteBinLine class="w-4 h-4" />
              </button>
            </div>

            <!-- 分组内容 (展开时显示) -->
            <div v-show="expandedGroup === gIndex" class="px-4 py-3">
              <div class="flex flex-col gap-2">
                <!-- 链接列表 -->
                <div
                  v-for="(link, lIndex) in group.links"
                  :key="lIndex"
                  class="flex items-center gap-2"
                >
                  <div class="flex-1 flex items-center gap-2 min-w-0">
                    <input
                      v-model="link.name"
                      :placeholder="
                        t(
                          'views.admin.Settings.site.footer.links.namePlaceholder',
                        )
                      "
                      class="w-1/3 min-w-0 px-3 py-2 rounded-lg bg-bg-muted/50 text-sm text-fg outline-none border border-transparent focus:border-primary/30 transition-colors placeholder:text-fg-muted/50"
                    />
                    <input
                      v-model="link.url"
                      :placeholder="
                        t(
                          'views.admin.Settings.site.footer.links.urlPlaceholder',
                        )
                      "
                      class="flex-1 min-w-0 px-3 py-2 rounded-lg bg-bg-muted/50 text-sm text-fg outline-none border border-transparent focus:border-primary/30 transition-colors placeholder:text-fg-muted/50"
                    />
                  </div>
                  <button
                    class="p-1.5 rounded-lg text-fg-muted hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
                    @click="removeLink(gIndex, lIndex)"
                  >
                    <RiDeleteBinLine class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- 添加链接按钮 -->
                <ButtonSecondary
                  :text="t('views.admin.Settings.site.footer.links.addLink')"
                  size="sm"
                  class="self-start mt-1"
                  @click="addLink(gIndex)"
                >
                  <RiAddLine class="w-4 h-4" />
                </ButtonSecondary>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-else
          class="text-sm text-fg-muted/60 text-center py-6 border border-dashed border-fg-muted/20 rounded-xl"
        >
          {{ t("common.list.empty") }}
        </div>
      </div>
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
