---
title: OpenCode 项目一键导入为工作区（V1）
date: 2026-03-17
status: draft
---

# OpenCode 项目一键导入为工作区（V1）

## 背景
当前工作区需要手动添加。希望通过 `opencode-ai/sdk` 直接拉取 OpenCode 项目列表，在 UI 中一键导入为 Workspace。

## 目标与范围
- 在 Workspace 列表页新增“导入 OpenCode”入口。
- UI 以弹窗形式展示项目列表，支持多选导入。
- API 使用 `opencode-ai/sdk` 实时拉取项目列表（不做缓存）。
- 导入时仅写入 `name` 与 `local_path` 字段。

## 非目标
- 不做自动同步/增量更新。
- 不新增复杂的项目镜像表。
- 不引入额外鉴权或配置（假设 SDK 可使用本机默认环境/配置）。

## 交互流程
1. 用户点击 Workspace 列表页中“导入 OpenCode”按钮（位于“添加工作区”按钮左侧）。
2. 前端打开导入弹窗，自动请求项目列表。
3. API 端调用 `opencode-ai/sdk` 的 `project.list()` 实时返回列表。
4. 用户多选项目并确认导入。
5. 前端提交所选项目到 API，API 批量创建 Workspace。
6. 前端刷新列表并提示导入结果（成功/跳过/失败）。

## API 设计
### 1) 获取 OpenCode 项目列表
- `GET /workspaces/import/opencode/list`
- 返回：`Array<{ name: string; local_path: string }>`

### 2) 批量导入
- `POST /workspaces/import/opencode`
- 请求体：
  ```json
  {
    "projects": [
      { "name": "foo", "local_path": "/path/foo" }
    ]
  }
  ```
- 返回（示例）：
  ```json
  {
    "imported": ["/path/foo"],
    "skipped": ["/path/bar"],
    "failed": [
      { "local_path": "/path/baz", "reason": "DB error" }
    ]
  }
  ```

## 数据写入
- Workspace 表仅写入：`name`、`local_path`。
- 若 `local_path` 已存在：默认跳过（计入 `skipped`）。

## 错误处理
- SDK 拉取失败：`GET` 返回 502，前端提示“获取失败，请稍后重试”。
- 导入失败：逐条记录失败原因，整体请求仍 200 返回统计。

## 测试策略（最小化）
- API 单测：
  - list：mock SDK 返回项目列表。
  - import：
    - 全新路径 -> imported
    - 已存在路径 -> skipped
    - DB 异常 -> failed
- 前端：
  - 弹窗打开触发 list 请求
  - 多选提交后刷新列表 + 结果提示

## 里程碑
- M1：API list + import + 基础单测
- M2：前端按钮 + 弹窗 + 多选导入
