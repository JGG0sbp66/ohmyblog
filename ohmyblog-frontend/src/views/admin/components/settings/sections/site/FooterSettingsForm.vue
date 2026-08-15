<!-- src/views/admin/components/settings/site/FooterSettingsForm.vue -->
<script setup lang="ts">
import { ref } from "vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import AccordionItem from "@/components/common/list/AccordionItem.vue";
import EmptyState from "@/components/common/list/EmptyState.vue";
import FooterLinkGroup from "./FooterLinkGroup.vue";
import { RiAddLine } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import { useListDrag } from "@/composables/list-drag.hook";
import { useStableKey } from "@/composables/stable-key.hook";
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

// --- 分组拖拽排序 ---
// 没有拖拽手柄：整张卡片都能拖，展开按钮/标题输入/删除按钮带 data-no-drag 除外。
// 分组重排必须用稳定 key，否则 Vue 只换内容不搬 DOM，让位动画和拖拽状态都会错位。
const keyOf = useStableKey();

const moveGroup = (from: number, to: number) => {
  const groups = systemStore.siteInfo.footerLinks;
  if (!groups) return;
  const [moved] = groups.splice(from, 1);
  if (!moved) return;
  groups.splice(to, 0, moved);

  // 展开态跟着被拖的分组走，否则拖完展开的是别人
  if (expandedGroup.value === from) expandedGroup.value = to;
  else if (expandedGroup.value === to) expandedGroup.value = from;
};

const { listRef, isDragging, itemStyle, hasMoved, onItemPointerDown } =
  useListDrag({ move: moveGroup });

/**
 * 抑制拖拽结束时补发的那一下 click。
 *
 * 卡片头部整块既是拖拽握持区又是「点击展开/收起」区。拖完松手浏览器仍会派发 click，
 * 不拦住的话每次拖拽都会顺手把分组折叠掉。
 */
const onGroupToggle = (index: number) => {
  if (hasMoved()) return;
  toggleGroup(index);
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
        <!-- 头部：标题 + 添加分组按钮 -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex flex-col gap-1 min-w-0">
            <h3
              class="text-sm font-bold tracking-wider text-fg-subtle uppercase"
            >
              {{ t("views.admin.Settings.site.footer.links.title") }}
            </h3>
            <!-- 手柄没了，得有句话告诉用户「按住就能拖」 -->
            <p
              v-if="
                systemStore.siteInfo.footerLinks &&
                systemStore.siteInfo.footerLinks.length > 1
              "
              class="text-xs text-fg-soft"
            >
              {{ t("views.admin.Settings.site.footer.links.reorderHint") }}
            </p>
          </div>
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

        <!--
          分组列表 (手风琴 + 拖拽排序)。
          容器的直接子元素只能是分组卡片本身：hook 靠 data-sortable-item 认项并按 DOM
          顺序对齐数据下标，混进别的元素就会错位。
        -->
        <div
          v-if="
            systemStore.siteInfo.footerLinks &&
            systemStore.siteInfo.footerLinks.length > 0
          "
          ref="listRef"
          class="flex flex-col gap-3"
        >
          <AccordionItem
            v-for="(group, gIndex) in systemStore.siteInfo.footerLinks"
            :key="keyOf(group)"
            data-sortable-item
            sortable
            :expanded="expandedGroup === gIndex"
            :dragging="isDragging(gIndex)"
            :style="itemStyle(gIndex)"
            @pointerdown="onItemPointerDown"
            @toggle="onGroupToggle(gIndex)"
            @remove="removeGroup(gIndex)"
          >
            <!-- 分组标题输入 -->
            <template #header>
              <TipInput
                v-model="group.title"
                :placeholder="
                  t(
                    'views.admin.Settings.site.footer.links.groupTitlePlaceholder',
                  )
                "
              />
            </template>

            <!-- 分组内的链接列表（自带一套独立的拖拽排序） -->
            <FooterLinkGroup :group="group" />
          </AccordionItem>
        </div>

        <!-- 空状态 -->
        <EmptyState v-else />
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
