<!-- src/views/admin/components/settings/sections/admin/RecoveryCodesPanel.vue -->
<!--
  恢复码展示面板：网格展示恢复码，提供下载方法供父组件调用。

  被两个流程复用：首次启用两步验证、以及后续重新生成。
  恢复码明文只在后端那一次响应里出现，关掉就再也拿不回来。
-->
<script setup lang="ts">
import { computed } from "vue";
import { useLang } from "@/composables/lang.hook";

const props = defineProps<{
  /** 明文恢复码 */
  codes: string[];
}>();

const { t } = useLang();

/** 纯文本形态，用于下载 */
const codesText = computed(() => props.codes.join("\n"));

const handleDownload = () => {
  const blob = new Blob([`${codesText.value}\n`], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ohmyblog-recovery-codes.txt";
  link.click();
  URL.revokeObjectURL(url);
};

defineExpose({ handleDownload });
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 恢复码网格。select-all 让用户点一下就能整段选中手动复制 -->
    <div class="grid grid-cols-2 gap-2 rounded-lg bg-bg-muted p-4">
      <code
        v-for="code in codes"
        :key="code"
        class="text-center text-sm font-mono font-semibold tracking-wide text-fg select-all"
      >
        {{ code }}
      </code>
    </div>
  </div>
</template>
