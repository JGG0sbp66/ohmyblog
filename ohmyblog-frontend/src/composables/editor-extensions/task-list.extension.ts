// src/composables/editor-extensions/task-list.extension.ts
//
// 任务列表（Notion / GitHub 风格 - [ ] / - [x]）
//
// - TaskList   : 容器节点 <ul data-type="taskList">
// - TaskItem   : 列表项节点 <li data-type="taskItem">，含 checkbox + 内容
//
// nested: true 允许嵌套子任务（缩进 / 反缩进走 Tab / Shift-Tab）。
// markdown 兼容：tiptap-markdown 默认能识别 GFM `- [ ]` 语法，
// 粘贴 markdown 待办列表会自动转 TaskList。

import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

export { TaskList };

/**
 * 任务项：允许嵌套；不开 onReadOnlyChecked 是因为前台只读模式
 * 的 editor.editable 已经是 false，复选框自然不可点。
 */
export const CustomTaskItem = TaskItem.configure({
  nested: true,
});
