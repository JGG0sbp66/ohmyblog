<!--
  src/views/admin/components/settings/sections/site/FooterLinkGroup.vue
  页脚某个分组内部的链接列表：增删 + 拖拽排序。

  单独拆成组件是为了「一个列表一个 hook 实例」—— useListDrag 的状态（谁在被拖、
  拖了多远）是列表私有的，分组列表和每个分组的链接列表各自持有一份，互不干扰。
  嵌套的两层拖拽靠 hook 内部的 stopPropagation 分流：指针落在链接行上就拖链接，
  落在分组头部/空白处就拖整组。
-->
<script setup lang="ts">
import TipInput from "@/components/common/input/TipInput.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import ListRowLayout from "@/components/common/list/ListRowLayout.vue";
import { RiAddLine } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import { useListDrag } from "@/composables/list-drag.hook";
import { useStableKey } from "@/composables/stable-key.hook";
import type { TFooterLinkGroup } from "@/api/shared";

const { t } = useLang();

// 直接改 props 里这个对象的 links 数组：它就是 store 里那个响应式对象，
// 与本页其它字段（标题、备案号）一样在编辑期直接改 store，保存时整份提交。
const props = defineProps<{ group: TFooterLinkGroup }>();

const keyOf = useStableKey();

const moveLink = (from: number, to: number) => {
  const [moved] = props.group.links.splice(from, 1);
  if (!moved) return;
  props.group.links.splice(to, 0, moved);
};

const { listRef, itemStyle, onItemPointerDown } = useListDrag({
  move: moveLink,
});

const addLink = () => {
  props.group.links.push({ name: "", url: "" });
};

const removeLink = (index: number) => {
  props.group.links.splice(index, 1);
};
</script>

<template>
  <div class="flex flex-col gap-3">
    <!--
      拖拽容器：直接子元素必须只有列表项本身（hook 靠 data-sortable-item 认项），
      所以「添加链接」按钮放在容器外面。
    -->
    <div
      v-if="group.links.length > 0"
      ref="listRef"
      class="flex flex-col gap-3"
    >
      <ListRowLayout
        v-for="(link, lIndex) in group.links"
        :key="keyOf(link)"
        data-sortable-item
        sortable
        :style="itemStyle(lIndex)"
        @pointerdown="onItemPointerDown"
        @remove="removeLink(lIndex)"
      >
        <div class="flex items-start gap-3">
          <!-- 链接名称 -->
          <div class="w-1/3 min-w-20" data-drag-hold>
            <TipInput
              v-model="link.name"
              :placeholder="
                t('views.admin.Settings.site.footer.links.namePlaceholder')
              "
            />
          </div>
          <!-- 链接 URL -->
          <div class="flex-1 min-w-0" data-drag-hold>
            <TipInput
              v-model="link.url"
              :placeholder="
                t('views.admin.Settings.site.footer.links.urlPlaceholder')
              "
            />
          </div>
        </div>
      </ListRowLayout>
    </div>

    <!-- 添加链接按钮 -->
    <ButtonSecondary
      :text="t('views.admin.Settings.site.footer.links.addLink')"
      size="sm"
      class="self-start group/addlink"
      data-no-drag
      @click="addLink"
    >
      <RiAddLine
        class="w-4 h-4 transition-transform duration-300 group-hover/addlink:rotate-90"
      />
    </ButtonSecondary>
  </div>
</template>
