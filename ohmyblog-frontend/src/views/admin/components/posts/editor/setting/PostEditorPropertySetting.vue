<!-- src/views/admin/components/posts/editor/setting/PostEditorPropertySetting.vue -->
<script setup lang="ts">
import { RiPushpinLine } from "@remixicon/vue";
import { useAutoAnimate } from "@formkit/auto-animate/vue";
import PostEditorSettingItem from "./PostEditorSettingItem.vue";
import ButtonToggle from "@/components/base/button/ButtonToggle.vue";
import BaseTooltip from "@/components/base/pop/BaseTooltip.vue";
import { useLang } from "@/composables/lang.hook";

/**
 * PostEditorPropertySetting — 文章属性设置块（布尔开关组）
 *
 * 定位：承载所有「布尔型文章属性」的开关集合，与各类「值型」设置块（标签 / slug /
 * 摘要 / 封面）并列。目前有「显示封面」和「置顶」两个属性，后续新属性（如允许
 * 评论、推荐等）直接在模板里再加一行即可，无需新开文件。
 *
 * 「显示封面」是唯一带条件出现的属性行：没上传封面时整行收起（由 auto-animate
 * 负责进出动画），上传后展开且默认开。开关只控制前台是否展示，coverImage 的
 * URL 始终保留 —— 关掉再打开即恢复，不需要重新上传。
 *
 * v-model:
 * - pinned: boolean —— 是否置顶（后端会把布尔翻译为 pinnedAt 时间戳）
 * - coverImage: string | null —— 封面图 URL，与 PostEditorCoverSetting 共享同一份状态
 * - coverEnabled: boolean —— 是否展示封面（走正常保存流程，同 pinned 一样是普通字段）
 */
const { t } = useLang();

const pinned = defineModel<boolean>("pinned", { default: false });
const coverImage = defineModel<string | null>("coverImage", { default: null });
const coverEnabled = defineModel<boolean>("coverEnabled", { default: true });

const [listRef] = useAutoAnimate();
</script>

<template>
  <PostEditorSettingItem
    :label="t('views.admin.PostEditor.settingsPanel.properties.label')"
    :tooltip="t('views.admin.PostEditor.settingsPanel.properties.tooltip')"
  >
    <template #icon>
      <RiPushpinLine class="w-4 h-4 text-fg-subtle" />
    </template>

    <!-- 属性开关列表：一行一个属性，未来直接往下加。
         容器挂 auto-animate，属性行（目前只有封面开关会）进出时平滑展开收起 -->
    <div ref="listRef" class="flex flex-col gap-3">
      <!-- 显示封面：仅在上传了封面后出现，默认开；关闭只是前台不展示，URL 保留 -->
      <div v-if="coverImage" class="flex items-center justify-between gap-3">
        <span class="text-sm text-fg select-none">
          {{ t("views.admin.PostEditor.settingsPanel.properties.cover.label") }}
        </span>
        <ButtonToggle v-model="coverEnabled" />
      </div>

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
