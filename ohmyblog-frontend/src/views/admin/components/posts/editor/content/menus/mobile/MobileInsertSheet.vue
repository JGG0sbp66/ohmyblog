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
 * `/` 命令面板在触屏上的等价入口：移动键盘要切到符号页才能打出 "/"，所以各家
 * （Notion / Craft / Bear / 飞书）都在工具条最左给一个 "+"。
 *
 * 三个边界：
 * - 命令来源复用 SLASH_GROUPS，不另立清单 —— 两个入口理应同能力，各写一份会漂移。
 * - 渲染不复用 CategoryMenu：那边只有「整行 icon+文字」和「纯 icon 网格 + hover
 *   tooltip」两种布局，前者一屏放不下几项，后者在手机上既无文字说明、拉宽后图标
 *   还孤零零飘在大格子里。这里用「图标在上、文字在下」的等宽瓦片。
 * - 高度由调用方给（传 flex-1），本组件不关心；只负责「显示命令、告诉外面选了哪个」，
 *   **不执行命令** —— 执行前要恢复光标、钉住滚动位置，那些只有工具条知道。
 */
const emit = defineEmits<{ select: [cmd: SlashCommand] }>();

defineProps<{
  activeCommandId?: string | null;
}>();

const { t } = useLang();
const { labelOf } = useSlashI18n();

interface SheetGroup {
  key: string;
  title?: string;
  danger?: boolean;
  commands: readonly SlashCommand[];
}

const groups = computed<SheetGroup[]>(() =>
  SLASH_GROUPS.map((group) => ({
    key: group.labelKey ?? "more",
    title: group.labelKey
      ? t(`views.admin.PostEditor.content.slashMenu.groups.${group.labelKey}`)
      : undefined,
    danger: group.danger,
    commands: group.commands,
  })),
);
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

      <!-- 四列等宽瓦片：14 个命令五行铺完，主流机型一屏可见，偏矮机型容器自己滚动 -->
      <div class="grid grid-cols-4 gap-0.5">
        <!-- 用 click 而不是 mousedown.prevent：后者接不到键盘 Enter/Space 与辅助
             设备派发的激活。焦点不会因此丢失 —— 工具条根节点已经统一吞掉了
             mousedown 的默认行为（见 MobileEditorToolbar.onRootMouseDown）。 -->
        <button
          v-for="cmd in group.commands"
          :key="cmd.id"
          type="button"
          class="flex flex-col items-center justify-start gap-1 rounded-xl px-1 py-2 transition-colors active:bg-bg-muted"
          :class="[
            group.danger ? 'text-red-500' : 'text-fg-muted',
            cmd.id === activeCommandId
              ? 'bg-bg-muted text-fg-subtle ring-1 ring-border/60'
              : undefined,
          ]"
          :aria-pressed="cmd.id === activeCommandId"
          @click="emit('select', cmd)"
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
