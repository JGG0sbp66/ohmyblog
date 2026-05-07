<!-- src/views/admin/components/posts/editor/content/node-views/CodeBlock.vue -->
<!--
  NodeView: 代码块节点的 Vue 定制渲染组件
  - header：MacOS 风格三圆点装饰 + 右侧语言标签输入框（同步到节点 attrs.language）
  - 行号列：根据文本内容实时计算行数，与代码行严格等高对齐
  - 内容区：NodeViewContent 渲染 ProseMirror 可编辑代码区
-->
<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import { computed, ref } from 'vue'
import { Copy, Check } from 'lucide-vue-next'

const props = defineProps(nodeViewProps)

const updateLanguage = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.updateAttributes({
    language: target.value,
  })
}

// 复制按钮：点击后复制代码内容，1.5s 后恢复图标
const copied = ref(false)
const copyCode = async () => {
  await navigator.clipboard.writeText(props.node.textContent)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}

// 计算行数
// ProseMirror 的 CodeBlock 内容末尾始终带有一个隐式 \n，
// 不去除会导致行号比实际多一行，且在某些编辑操作后出现忽多忽少的 bug
const lineCount = computed(() => {
  const text = props.node.textContent
  const normalized = text.endsWith('\n') ? text.slice(0, -1) : text
  return normalized.split('\n').length
})
</script>

<template>
  <node-view-wrapper class="code-block-container">
    <!-- 悬浮复制按钮：默认隐藏，鼠标移入容器时显示于右上角 -->
    <button
      class="code-block-copy-btn"
      :class="{ copied }"
      contenteditable="false"
      @click="copyCode"
    >
      <Check v-if="copied" :size="13" />
      <Copy v-else :size="13" />
    </button>

    <!-- header：三圆点 (CSS ::before) + 语言标签输入框 -->
    <div class="code-block-header" contenteditable="false">
      <input
        type="text"
        :value="node.attrs.language"
        class="code-block-lang-input"
        placeholder="TEXT"
        spellcheck="false"
        autocomplete="off"
        @input="updateLanguage"
      />
    </div>
    <div class="code-block-content">
      <!-- 行号列 -->
      <div class="line-numbers" contenteditable="false">
        <span v-for="n in lineCount" :key="n">{{ n }}</span>
      </div>
      <pre><node-view-content as="code" /></pre>
    </div>
  </node-view-wrapper>
</template>
