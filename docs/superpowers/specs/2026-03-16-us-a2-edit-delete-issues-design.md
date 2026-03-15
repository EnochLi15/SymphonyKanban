# US-A2 编辑与删除任务 - 设计文档

## 背景与目标
作为任务 owner，需要在任务详情页内联编辑任务内容，并支持删除无效任务，以保持任务池准确与干净。

目标：
- 支持编辑：标题、描述、优先级、标签、工作区、状态
- 支持删除（软删除）且需要确认
- 状态变化与字段变化可追溯（事件快照）

## 范围
包含：
- 前端：任务详情页内联编辑与删除确认
- API：任务更新/删除接口
- 数据库：issues、issue_events（含软删除字段）

不包含：
- 用户/权限体系（actor 固定值）
- 复杂并发冲突解决（版本号/ETag）

## 设计方案（推荐）
采用字段级即时保存 + 统一事件快照追溯的方案。
- 每次字段变更即保存
- 更新/删除均写入 issue_events 快照

## 数据模型
### issues
- 增加或使用 `deleted_at` 字段（空表示未删除）
- 软删除时设置 `deleted_at = now`
- 查询默认排除 `deleted_at` 不为空的数据

### issue_events
- `event_type = "issue_updated"`：编辑事件
- `event_type = "issue_deleted"`：删除事件
- `payload`：存储**变更后快照**
  - 包含 `id/title/description/priority/workspace_id/tags/status/deleted_at/updated_at` 等
- `actor`：固定值（不引入用户体系）

## API 设计
### PATCH /issues/:id
用途：更新单个或多个字段。
- 请求体支持 partial 更新
- `tags` 为最终标签列表（全量替换）
- 返回完整 Issue（含 tags/workspace/status）
- 写入 `issue_events`（更新快照）

### DELETE /issues/:id
用途：软删除。
- 设置 `deleted_at = now`
- 写入 `issue_events`（删除快照）
- 返回删除后的完整 Issue

### 读取与访问控制
- 读取单条 issue 若 `deleted_at` 不为空，返回 404（或业务错误）
- 前端接收后跳回列表/看板并提示“任务已删除”

## 前端交互
- 任务详情页字段内联编辑（标题、描述、优先级、标签、工作区、状态）
- 字段级即时保存
- 标签编辑采用“全量替换”提交
- 删除按钮触发普通确认弹窗
- 删除成功后返回列表/看板；删除后详情访问不可用

## 事件与追溯
- 所有状态变化与字段变化均写入 `issue_events`
- 事件 payload 记录变更后完整快照，用于审计/回溯

## 错误处理与一致性
- 后端采用 last-write-wins，不引入版本冲突控制
- PATCH 失败：前端回滚字段并提示
- DELETE 失败：提示错误并保持原状态

## 测试与验证
- API：更新字段、删除、读取已删除均符合预期
- 事件：issue_events 写入更新/删除快照
- 前端：内联编辑即时保存；失败回滚；删除确认生效；删除后不可访问

