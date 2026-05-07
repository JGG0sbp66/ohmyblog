<!-- src/views/admin/components/posts/editor/content/node-views/CodeBlock.vue -->
<!--
  NodeView: 代码块节点的 Vue 定制渲染组件
  - header：MacOS 风格三圆点装饰 + 右侧语言标签输入框（同步到节点 attrs.language）
  - 行号列：根据文本内容实时计算行数，与代码行严格等高对齐
  - 内容区：NodeViewContent 渲染 ProseMirror 可编辑代码区
-->
<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import { computed } from 'vue'

const props = defineProps(nodeViewProps)

const updateLanguage = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.updateAttributes({
    language: target.value,
  })
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
    <!-- header：三圆点 (CSS ::before) + 语言标签输入框 -->
    <div class="code-block-header" contenteditable="false">
      <input
        type="text"
        :value="node.attrs.language"
        class="code-block-lang-input"
        placeholder="TEXT"
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
