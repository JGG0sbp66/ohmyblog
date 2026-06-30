<!-- src/views/admin/components/posts/editor/setting/PostEditorPropertySetting.vue -->
<script setup lang="ts">
import { RiPushpinLine } from "@remixicon/vue";
import PostEditorSettingItem from "./PostEditorSettingItem.vue";
import ButtonToggle from "@/components/base/button/ButtonToggle.vue";
import BaseTooltip from "@/components/base/pop/BaseTooltip.vue";
import { useLang } from "@/composables/lang.hook";

/**
 * PostEditorPropertySetting — 文章属性设置块（布尔开关组）
 *
 * 定位：承载所有「布尔型文章属性」的开关集合，与各类「值型」设置块（标签 / slug /
 * 摘要 / 封面）并列。目前只有「置顶」一个属性，后续新属性（如允许评论、推荐等）
 * 直接在模板里再加一行 PropertyRow 即可，无需新开文件。
 *
 * v-model:
 * - pinned: boolean —— 是否置顶（后端会把布尔翻译为 pinnedAt 时间戳）
 */
const { t } = useLang();

const pinned = defineModel<boolean>("pinned", { default: false });
</script>

<template>
  <PostEditorSettingItem
    :label="t('views.admin.PostEditor.settingsPanel.properties.label')"
    :tooltip="t('views.admin.PostEditor.settingsPanel.properties.tooltip')"
  >
    <template #icon>
      <RiPushpinLine class="w-4 h-4 text-fg-subtle" />
    </template>

    <!-- 属性开关列表：一行一个属性，未来直接往下加 -->
    <div class="flex flex-col gap-3">
      <!-- 置顶 -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-1.5">
          <span class="text-sm text-fg select-none">
            {{
              t("views.admin.PostEditor.settingsPanel.properties.pinned.label")
            }}
          </span>
          <BaseTooltip
            :content="
              t(
                'views.admin.PostEditor.settingsPanel.properties.pinned.tooltip',
              )
            "
          />
        </div>
        <ButtonToggle v-model="pinned" />
      </div>
    </div>
  </PostEditorSettingItem>
</template>
