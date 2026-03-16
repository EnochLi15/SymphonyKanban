---
title: MVP (US-B1~G3) 全链路设计：调度、执行、审查与工作区
status: draft
date: 2026-03-16
---

# MVP (US-B1~G3) 全链路设计：调度、执行、审查与工作区

## 1. 目标与范围

**目标**：在现有 Symphony Kanban 基础上，实现 MVP 所需的全链路闭环：标签与工作流配置、自动调度与并发策略、执行与证据回写、Review/Blocked 人工治理、工作区管理与任务关联。

**范围**（本次实现）：
- US-B1 管理标签
- US-B2 标签绑定工作流策略
- US-C1 Todo 自动调度
- US-C2 并发与排队策略
- US-C3 Symphony 调用 Opencode 执行任务
- US-D1 查看实时执行状态（前端轮询）
- US-D2 查看日志、Diff 和测试结果
- US-D3 完成任务必须附带证据
- US-E1 Review 页面审查任务结果
- US-E2 批准、打回或要求补充证据
- US-F1 执行失败自动进入 Blocked
- US-F2 Blocked 页面重试或补充上下文
- US-G1 查看和添加工作区
- US-G2 配置工作区上下文
- US-G3 任务关联工作区

**非目标**（本次不做）：
- US-A4 优先级视图
- US-E3 手动接管任务
- US-H1 MCP 服务能力
- 复杂 workflow 可视化编排

## 2. 关键约束与假设

- 单用户本地应用，无账号/权限模型。
- Opencode 通过本地端口 `:4096` 运行，可直接使用 SDK。
- 执行产物（日志、diff、测试、summary）全部存入数据库。
- 前端用轮询刷新执行状态（非 SSE/WebSocket）。
- 任务状态集合必须与文档一致：`Backlog / Todo / In Progress / Review / Done / Blocked`。
- 进入 `Done` 的证据门槛：**必须同时具备 log + diff + summary**；带 `ci-required` 标签还必须具备 test 证据。

## 3. 架构分层与职责边界

- **前端（Vue3）**
  - 展示：标签、工作区、看板卡片、Review/Blocked 页面、执行证据与状态。
  - 操作：配置标签与 workflow、审核、重试、补充上下文。

- **API（Express + SQLite）**
  - 事实源：任务、标签、工作区、执行记录与证据、事件日志。
  - 校验：状态流转与证据门槛。
  - 聚合：Review 数据与执行 artifact 查询。

- **Symphony（TypeScript / fizzy-popper）**
  - 调度：轮询 Todo，应用并发与排队策略，更新任务状态。
  - 执行：调用 Opencode SDK，监听事件流并写回执行结果。
  - 失败：触发 Blocked 并写回原因。

- **Opencode（本地 4096 + SDK）**
  - 执行代码并产出执行 artifacts（日志、diff、测试、summary）。

## 4. 数据模型（新增/调整）

### 4.1 tags
- `id`, `name`, `type`, `color`, `created_at`, `updated_at`

### 4.2 workflow_defs
- `id`, `tag_id`, `state`, `behavior`, `config_json`, `created_at`, `updated_at`
- 用于定义标签在状态上的行为映射（例：`ci-required`）。

### 4.3 workspaces
- `id`, `name`, `local_path`, `context`, `created_at`, `updated_at`

### 4.4 issues（已有，补充关注字段）
- `id`, `title`, `description`, `priority`, `status`, `workspace_id`, `created_at`, `updated_at`

### 4.5 issue_tags
- `issue_id`, `tag_id`

### 4.6 executions
- `id`, `issue_id`, `status`, `started_at`, `finished_at`, `error_summary`, `runner`, `attempt`, `created_at`

### 4.7 execution_artifacts
- `id`, `execution_id`, `type`, `content`, `summary`, `created_at`
- `type` in `log | diff | test | summary`

## 5. 状态流转与校验规则

### 5.1 状态流
- 正常：`Backlog -> Todo -> In Progress -> Review -> Done`
- 失败：任意执行失败进入 `Blocked`
- 恢复：`Blocked -> In Progress`（Retry）
- Review：`Review -> Done`（Approve）
- Review：`Review -> In Progress` 或 `Blocked`（Reject/补充证据）

### 5.2 证据门槛（US-D3）
- 进入 Done 前必须同时具备：`log + diff + summary`。
- 若标签包含 `ci-required`，额外必须具备 `test`。
- API 层负责强校验，失败则拒绝状态变更。

## 6. 调度与并发策略

### 6.1 自动调度（US-C1）
- Symphony 固定间隔轮询 API 获取 `Todo` 任务。
- 拉取按 `priority` desc + `created_at` asc 排序。
- 拉取成功后立即将任务改为 `In Progress` 并写事件。

### 6.2 并发与排队（US-C2）
- 全局并发上限 `MAX_CONCURRENCY`。
- 超过上限进入等待队列，按优先级与 FIFO 排队。
- 执行结束释放并发槽位，触发下一任务调度。

## 7. Opencode 集成与执行事件

### 7.1 事件流为主
- Symphony 使用 SDK 的 **SSE 事件流**（`event.subscribe()`）作为主要状态来源。
- 根据事件类型写回 `executions.status` 与 `issues.status`。

### 7.2 查询兜底
- 若事件不完整或未包含终态，Symphony 使用查询接口兜底（以 SDK types 为准）。

### 7.3 结果写回
- 成功：写 `executions` 与 `execution_artifacts`，任务转 `Review`。
- 失败：写 `executions.error_summary`，任务转 `Blocked`。

## 8. 前端页面与交互

### 8.1 标签管理（US-B1）
- 标签列表 + 创建/编辑/删除
- 删除二次确认

### 8.2 Tag & Workflow 配置（US-B2）
- 标签与行为映射的配置表格
- 保存后立即生效

### 8.3 执行状态与日志（US-D1/US-D2）
- 看板卡片与任务详情显示运行态
- Web Session 页面展示日志摘要、diff、测试
- 前端轮询 `/executions/:id/status`

### 8.4 Review 页面（US-E1/US-E2）
- 展示 Summary + Diff + Test
- 操作：Approve / Reject / 请求补证据

### 8.5 Blocked 页面（US-F1/US-F2）
- 展示失败原因与快照
- 操作：Retry / 补充上下文后 Retry

### 8.6 Workspace 管理（US-G1/US-G2/US-G3）
- Workspace 列表、创建与编辑
- 任务创建/编辑时选择 workspace

## 9. API 端点（草案）

### 标签与 workflow
- `GET /api/tags`
- `POST /api/tags`
- `PATCH /api/tags/:id`
- `DELETE /api/tags/:id`
- `GET /api/workflows`
- `POST /api/workflows`
- `PATCH /api/workflows/:id`

### 工作区
- `GET /api/workspaces`
- `POST /api/workspaces`
- `PATCH /api/workspaces/:id`

### 任务与调度
- `GET /api/issues`
- `POST /api/issues`
- `PATCH /api/issues/:id`
- `POST /api/issues/:id/retry`
- `GET /api/issues/:id/executions`

### 执行与证据
- `GET /api/executions/:id/status`
- `GET /api/executions/:id/artifacts`
- `POST /api/executions/:id/artifacts`
- `POST /api/executions` / `PATCH /api/executions/:id`

### Review 聚合
- `GET /api/review/:issueId`

### 状态流转校验
- `POST /api/issues/:id/transition`

## 10. 错误处理策略

- 执行失败：写 error_summary，任务转 Blocked。
- 证据不全：拒绝 Done 状态变更并返回明确错误。
- 调度冲突：并发超限进入队列，完成后重新调度。
- 事件缺失：超时触发兜底查询。

## 11. 测试策略

- API 单元测试：状态流转与证据校验、workflow 绑定
- Symphony 集成测试：调度、并发、失败处理、事件回写
- 前端 E2E：Review/Blocked 流程与证据展示

## 12. 验收映射

- US-B1/B2：标签 CRUD 与行为映射生效
- US-C1/C2/C3：Todo 自动调度 + 并发限制 + Opencode 执行
- US-D1/D2/D3：状态可见 + 证据可查 + Done 门槛强校验
- US-E1/E2：Review 页面审查 + Approve/Reject 流程
- US-F1/F2：失败进入 Blocked + Retry
- US-G1/G2/G3：Workspace 管理与关联

