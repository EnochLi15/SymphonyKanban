---
title: 根目录 pnpm 服务指令设计（dev/stop/restart）
status: draft
date: 2026-03-16
---

# 根目录 pnpm 服务指令设计（dev/stop/restart）

## 1. 目标

提供三个根目录命令，统一管理本仓库三类服务（API / Web / Symphony）：

- `pnpm dev`：启动全部服务
- `pnpm stop`：停止全部服务
- `pnpm restart`：重启全部服务

## 2. 范围

- 仅管理仓库内服务：
  - `packages/symphony-kanban-api`
  - `packages/symphony-kanban-web`
  - `packages/symphony-kanban-symphony`
- 不涉及 Opencode 或其他外部服务。

## 3. 实现方式

- 启动：使用 `concurrently` 同时启动三个 `dev` 进程。
- 停止：脚本读取 PID 文件，逐个发送 `SIGTERM`。
- 重启：`stop` 后再 `start`。

## 4. 目录与文件

- 新增脚本：`scripts/services.mjs`
- 新增运行时目录：`.runtime/`
  - PID 文件：`.runtime/services.pids`
  - 该目录写入 `.gitignore`，不入库。

## 5. 命令映射

- `pnpm dev` → `node scripts/services.mjs start`
- `pnpm stop` → `node scripts/services.mjs stop`
- `pnpm restart` → `node scripts/services.mjs restart`

## 6. 行为约束

- `dev` 若检测到 PID 文件已存在，应提示用户先执行 `pnpm stop`。
- `stop` 若 PID 文件不存在，提示无需停止。
- `restart` 始终执行 stop + start。

