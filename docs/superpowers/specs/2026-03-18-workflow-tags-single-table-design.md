# Symphony Kanban 标签/工作流单表融合设计稿

日期：2026-03-18

## 背景与目标
- “工作流定义”应是与规则/验收标准平级的纯文本字段。
- 标签与工作流配置只需要一个表，结构应更直观。
- 废弃 `workflow_defs` 与 `/workflows` API，仅保留 `tags` 作为唯一来源。
- Hooks（after_create / before_remove）保留为工作流定义的辅助字段，但不进入 opencode prompt。
- Symphony prompt 只拼接 `workflow_definition + rules + acceptance_criteria`。

## 范围
- 数据模型：`tags` 增加新字段并作为唯一来源。
- API：移除 `/workflows` 端点与 workflow store 的读写依赖。
- Web：标签与工作流页面只读写 tags 字段。
- Symphony：从 tags 读取并拼 prompt。

## 数据模型
在 `tags` 表新增字段（保持 snake_case）：
- `state`：触发状态（如 Todo）
- `behavior`：工作流行为标识（如 bugfix / code-review）
- `workflow_definition`：工作流定义（纯文本）
- `after_create`：Hooks（文本）
- `before_remove`：Hooks（文本）

旧数据不迁移，新增字段默认为 `NULL`。

## 内置标签默认值
内置标签使用 JSON 默认模板写入以下字段：
- `state` / `behavior`
- `workflow_definition`
- `rules` / `acceptance_criteria`
- `after_create` / `before_remove`

## 设计方案

### 架构
- `tags` 作为唯一来源，`workflow_defs` 表与 `/workflows` API 彻底废弃。
- UI 与 Symphony 仅使用 tags 读取/更新工作流相关配置。

### 数据流
1. API 启动读取 `builtin-tags.json`，写入 tags 新字段。
2. Web “标签与工作流配置”页面：
   - 工作流定义 = `workflow_definition`
   - 规则/验收 = `rules`/`acceptance_criteria`
   - Hooks = `after_create`/`before_remove`
3. Symphony scheduler：
   - 找到 issue tag → 读取 tags 字段 → 组合 prompt（仅 `workflow_definition + rules + acceptance_criteria`）。

### 错误处理
- 新字段为空时，prompt 中跳过对应段落。
- Hooks 为空不影响保存与执行。
- `/workflows` 端点移除后若被调用，返回 404（前端同步移除调用）。

### 测试
- API：验证 tags 新字段可读写；内置标签默认值写入正确。
- Web：标签配置页字段映射为 tags 单表字段。
- Symphony：prompt 组合只依赖 tags。

## 非目标
- 不迁移历史 workflow_defs 数据。
- 不引入新的工作流可视化编排功能。
