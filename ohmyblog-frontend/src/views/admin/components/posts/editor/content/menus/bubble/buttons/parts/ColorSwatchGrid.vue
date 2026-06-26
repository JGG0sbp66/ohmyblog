<!-- src/views/admin/components/posts/editor/content/menus/bubble/buttons/parts/ColorSwatchGrid.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useLang } from "@/composables/lang.hook";

/**
 * ColorSwatchGrid — 颜色选择网格（预设色板 + 自定义取色）
 *
 * 被字体色 / 背景高亮 / 单元格背景三处复用（BubbleColorButton、BubbleCellBgButton）。
 * - 预设：传入 colors（{ key, value }），value=null 表示「默认 / 无」（虚线空心圈）。
 * - 自定义：末尾彩虹圈，点击唤起系统取色器；当前色为非预设值时该圈高亮并显示该色。
 * - 纯展示 + 派发：不碰 editor，选中结果通过 select 事件回传（值为 hex / 预设值 / null）。
 *
 * 色名走 i18n colorMenu.colors.*（自定义项用 colorMenu.colors.custom）。
 */
type Swatch = { key: string; value: string | null };

const props = defineProps<{
  /** 预设色板；value=null 视为「默认 / 无」 */
  colors: Swatch[];
  /** 当前生效色（hex / rgba / null），用于高亮选中态 */
  current: string | null;
}>();

const emit = defineEmits<{ select: [value: string | null] }>();

const { t } = useLang();

const colorLabel = (key: string) =>
  t(`views.admin.PostEditor.content.colorMenu.colors.${key}`);

/** current 是否为自定义色（非空且不在预设里） */
const isCustomActive = computed(
  () =>
    props.current !== null &&
    !props.colors.some((c) => c.value === props.current),
);

/** 系统取色器只接受合法 hex；current 非 hex（rgba / null）时回退黑色 */
const customInputValue = computed(() =>
  isCustomActive.value && /^#[0-9a-f]{6}$/i.test(props.current ?? "")
    ? (props.current as string)
    : "#000000",
);

const onCustom = (e: Event) => {
  emit("select", (e.target as HTMLInputElement).value);
};
</script>

<template>
  <div class="flex flex-wrap gap-1.5">
    <!-- 预设色块 -->
    <button
      v-for="c in colors"
      :key="c.key"
      :title="colorLabel(c.key)"
      class="w-5 h-5 rounded-full transition-transform hover:scale-110"
      :class="{
        'ring-2 ring-accent ring-offset-1 ring-offset-bg-card':
          current === c.value,
      }"
      :style="
        c.value
          ? { background: c.value, border: '1px solid rgba(127,127,127,0.25)' }
          : { background: 'transparent', border: '1.5px dashed #9ca3af' }
      "
      @mousedown.prevent="emit('select', c.value)"
    />

    <!-- 自定义取色：彩虹圈 + 叠加透明 input[type=color] 唤起系统取色器。
         不用 mousedown.prevent，否则系统取色器无法弹出；应用时各按钮再 focus 回编辑器。 -->
    <label
      :title="colorLabel('custom')"
      class="relative w-5 h-5 rounded-full cursor-pointer overflow-hidden transition-transform hover:scale-110"
      :class="{
        'ring-2 ring-accent ring-offset-1 ring-offset-bg-card': isCustomActive,
      }"
      :style="
        isCustomActive
          ? { background: current!, border: '1px solid rgba(127,127,127,0.25)' }
          : {
              background:
                'conic-gradient(red, orange, yellow, lime, aqua, blue, magenta, red)',
            }
      "
    >
      <input
        type="color"
        :value="customInputValue"
        class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        @change="onCustom"
      />
    </label>
  </div>
</template>
