<!-- src/views/admin/components/settings/site/FooterSettingsForm.vue -->
<script setup lang="ts">
import { ref } from "vue";
import SettingCard from "@/components/base/card/SettingCard.vue";
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonPrimary from "@/components/base/button/ButtonPrimary.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import AccordionItem from "@/components/common/list/AccordionItem.vue";
import ListRowLayout from "@/components/common/list/ListRowLayout.vue";
import EmptyState from "@/components/common/list/EmptyState.vue";
import { RiAddLine, RiDraggable } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import { useListDrag } from "@/composables/list-drag.hook";
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
// 手柄挂在手风琴头部，鼠标与触摸走同一套 Pointer Events（见 list-drag.hook）
const groupEls = ref<HTMLElement[]>([]);

/**
 * 收集每个分组的根元素供拖拽测量高度。
 *
 * AccordionItem 是组件，模板 ref 拿到的是组件实例，取 $el 才是根 DOM。
 * 用数组下标而不是 push：v-for 重渲染时这个回调会被反复调用，
 * push 会越积越多且顺序错乱。
 */
const setGroupEl = (el: unknown, index: number) => {
  const node =
    el && typeof el === "object" && "$el" in el
      ? ((el as { $el: HTMLElement }).$el as HTMLElement)
      : (el as HTMLElement | null);
  if (node) groupEls.value[index] = node;
};

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

const {
  dragStyle,
  isDragging,
  hasMoved,
  onPointerDown,
  onPointerMove,
  onPointerUp,
} = useListDrag({
  count: () => systemStore.siteInfo.footerLinks?.length ?? 0,
  move: moveGroup,
  getItemEl: (index) => groupEls.value[index] ?? null,
});

/**
 * 抑制拖拽结束时补发的那一下 click。
 *
 * 手柄位于手风琴头部内，而头部整块是「点击展开/收起」的区域。
 * 拖完松手浏览器仍会派发 click，不拦住的话每次拖拽都会顺手把分组折叠掉。
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
        <!-- 头部：标题 + 添加分组按钮 -->
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-bold tracking-wider text-fg-subtle uppercase">
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
          <AccordionItem
            v-for="(group, gIndex) in systemStore.siteInfo.footerLinks"
            :key="gIndex"
            :ref="(el) => setGroupEl(el, gIndex)"
            :expanded="expandedGroup === gIndex"
            :style="isDragging(gIndex) ? dragStyle : undefined"
            @toggle="onGroupToggle(gIndex)"
            @remove="removeGroup(gIndex)"
          >
            <!--
              拖拽手柄。
              touch-none 是必须的：不禁掉浏览器的默认触摸行为，手指一动就变成页面滚动，
              pointermove 收不到后续事件，移动端完全拖不起来。
            -->
            <template #handle>
              <button
                type="button"
                class="shrink-0 touch-none cursor-grab rounded-md p-1 text-fg-subtle transition-colors hover:bg-fg-muted/10 hover:text-fg active:cursor-grabbing"
                :aria-label="
                  t('views.admin.Settings.site.footer.links.dragGroup')
                "
                @pointerdown="onPointerDown($event, gIndex)"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
                @click.stop
              >
                <RiDraggable class="h-4 w-4" />
              </button>
            </template>

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

            <!-- 分组内的链接列表 -->
            <div class="flex flex-col gap-3">
              <ListRowLayout
                v-for="(link, lIndex) in group.links"
                :key="lIndex"
                @remove="removeLink(gIndex, lIndex)"
              >
                <div class="flex items-start gap-3">
                  <!-- 链接名称 -->
                  <div class="w-1/3 min-w-20">
                    <TipInput
                      v-model="link.name"
                      :placeholder="
                        t(
                          'views.admin.Settings.site.footer.links.namePlaceholder',
                        )
                      "
                    />
                  </div>
                  <!-- 链接 URL -->
                  <div class="flex-1 min-w-0">
                    <TipInput
                      v-model="link.url"
                      :placeholder="
                        t(
                          'views.admin.Settings.site.footer.links.urlPlaceholder',
                        )
                      "
                    />
                  </div>
                </div>
              </ListRowLayout>

              <!-- 添加链接按钮 -->
              <ButtonSecondary
                :text="t('views.admin.Settings.site.footer.links.addLink')"
                size="sm"
                class="self-start group/addlink"
                @click="addLink(gIndex)"
              >
                <RiAddLine
                  class="w-4 h-4 transition-transform duration-300 group-hover/addlink:rotate-90"
                />
              </ButtonSecondary>
            </div>
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
