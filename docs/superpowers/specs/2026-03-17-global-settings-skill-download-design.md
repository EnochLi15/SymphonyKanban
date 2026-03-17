# 全局设置页：Skill 下载入口设计

## 概述
在全局设置页 `/settings` 增加“技能中心 (Skills)”卡片，用于展示 `Symphony Board CRUD` 技能的介绍与下载按钮；同时移除现有 MCP 集成展示区块。

## 目标
- 在 UI 中提供可见的技能说明与下载入口。
- 保持页面风格与现有全局设置一致。
- 明确移除 MCP 相关内容。

## 范围
**包含：**
- 删除 `MCP 服务集成` 标题及相关卡片内容。
- 新增 `技能中心 (Skills)` 卡片，包含：
  - 技能名称
  - 简介
  - 能力点列表（3-4 条）
  - 下载按钮
  - MCP 移除提示

**不包含：**
- 后端下载接口实现（先用静态资源链接）。
- 技能管理后台或多技能列表扩展。

## UI 结构与文案

### 页面结构
- 标题：`全局系统设置 (Global Settings)`（保持不变）
- 内容区域：替换原 `MCP 服务集成` 区块为 `技能中心 (Skills)` 区块

### 卡片内容
- **区块标题**：`技能中心 (Skills)`
- **卡片标题**：`Symphony Board CRUD`
- **简介**：
  - “Symphony Board CRUD 技能用于在看板中新增、查看、更新与删除任务（Issue），并通过现有 API/CLI 快速管理。”
- **能力点（列表）**：
  1. 新建任务（Issue）并自动记录事件
  2. 查看所有任务与状态概览
  3. 更新任务信息与流转状态
  4. 删除/归档任务（遵循系统安全规则）
- **提示**：
  - “已移除 MCP 相关内容，技能专注于看板任务管理。”

## 下载行为
- 下载按钮链接到静态资源，例如 `/skills/symphony-board-crud.zip`。
- 前端以链接方式触发下载（无需新增 API）。
- 若未来需要动态打包或鉴权下载，再新增后端端点。

## 交互与样式
- 复用现有 `el-card` 与 `mcp-box` 样式体系：
  - `background: var(--kanban-surface)`
  - `border: 1px solid var(--kanban-border)`
- 下载按钮使用与 `保存全局设置` 相同主按钮样式。
- 文案与提示使用既有 `box-title`、`box-hint` 语义。

## 验收标准
- `/settings` 页面不再显示任何 MCP 相关内容。
- 页面展示“技能中心 (Skills)”卡片，信息完整、层级清晰。
- 下载按钮存在，指向静态资源路径。

## 需要修改的文件
- `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/settings/global-settings-view.vue`

