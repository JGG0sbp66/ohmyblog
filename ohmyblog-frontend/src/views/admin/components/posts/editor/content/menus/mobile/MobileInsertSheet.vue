<!-- src/views/admin/components/posts/editor/content/menus/mobile/MobileInsertSheet.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useLang } from "@/composables/lang.hook";
import {
  SLASH_GROUPS,
  useSlashI18n,
  type SlashCommand,
} from "../slash/slash-commands";

/**
 * MobileInsertSheet — 移动端「+」插入面板
 *
 * 它是 `/` 命令面板在触屏上的等价入口：移动键盘要切到符号页才能打出 "/"，
 * 行业里（Notion / Craft / Bear / 飞书）统一的解法都是在工具条最左给一个 "+"。
 *
 * 命令来源直接复用 SLASH_GROUPS，不另立一份清单——两个入口理应完全同能力，
 * 各写一份迟早会漂移。这里只换渲染形态。
 *
 * 为什么不复用 CategoryMenu：那是给桌面端下拉菜单设计的（整行 icon+文字，
 * 或纯 icon 网格 + hover tooltip）。搬到手机上，纯 icon 网格没有文字说明、
 * 拉宽后图标孤零零飘在大格子里；整行模式又一屏只放得下四五项。这里改成
 * 「图标在上、文字在下」的等宽瓦片，一屏能铺完全部命令且每项都有名字——
 * 这也是各家移动端插入面板的通行形态。
 *
 * 关于 SlashCommand.run(editor, range) 的 range：
 * slash 场景下它是待删除的 "/foo" 文本区间；这里没有触发文本可删，传入光标处的
 * 空区间（from === to），deleteRange 退化成 no-op。命令签名因此不用为移动端改动。
 */
/**
 * 高度不由本组件决定：调用方传 `flex-1`，让它吃掉「钉住的工具条」到「视口底」
 * 之间的剩余空间。键盘退场腾出多少就长多少，既不用预测键盘高度，也没有
 * 「面板已占位、键盘还没走」造成的跳动。
 */
/**
 * 本组件只管「显示命令、告诉外面选了哪个」，**不负责执行**。
 *
 * 执行权收归 MobileEditorToolbar，因为命令跑之前必须先做两件它才知道的事：
 * 把光标恢复到打开面板前的位置、把正文的滚动位置钉住。曾经在这里直接执行、
 * 再 emit 通知外面钉滚动 —— 顺序反了，命令内部的 chain().focus() 早就把视图
 * 滚走了，于是「选个 H1，正文就往上蹿一段」。
 */
const emit = defineEmits<{ select: [cmd: SlashCommand] }>();

const { t } = useLang();
const { labelOf } = useSlashI18n();

interface SheetGroup {
  key: string;
  title?: string;
  danger?: boolean;
  commands: SlashCommand[];
}

const groups = computed<SheetGroup[]>(() =>
  SLASH_GROUPS.map((group) => ({
    key: group.labelKey ?? "more",
    title: group.labelKey
      ? t(`views.admin.PostEditor.content.slashMenu.groups.${group.labelKey}`)
      : undefined,
    danger: group.danger,
    commands: [...group.commands],
  })),
);

const select = (cmd: SlashCommand) => emit("select", cmd);
</script>

<template>
  <div
    class="overflow-y-auto overscroll-contain bg-bg-card pb-[env(safe-area-inset-bottom,0px)]"
  >
    <div
      v-for="group in groups"
      :key="group.key"
      class="px-2 pt-2.5 last:pb-2"
      :class="group.danger ? 'mt-1 border-t border-border/30' : undefined"
    >
      <div
        v-if="group.title"
        class="px-2 pb-1 text-xs text-fg-soft select-none"
      >
        {{ group.title }}
      </div>

      <!-- 四列等宽瓦片：14 个命令刚好五行铺完，配合面板高度（=键盘高度）
           在主流机型上一屏可见；机型偏矮时容器自己滚动 -->
      <div class="grid grid-cols-4 gap-0.5">
        <button
          v-for="cmd in group.commands"
          :key="cmd.id"
          type="button"
          class="flex flex-col items-center justify-start gap-1 rounded-xl px-1 py-2 active:bg-bg-muted"
          :class="group.danger ? 'text-red-500' : 'text-fg-muted'"
          @mousedown.prevent="select(cmd)"
        >
          <component
            :is="cmd.icon"
            class="h-5 w-5 shrink-0"
            :class="group.danger ? undefined : cmd.color"
          />
          <span class="text-center text-[11px] leading-tight">
            {{ labelOf(cmd) }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
