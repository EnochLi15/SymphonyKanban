# Opencode 会话面板显示与全屏设计

## 背景与目标
在卡片详情页中，“Opencode 会话”面板目前仅在进行中显示。需要扩展到更多状态，并提供页面内全屏切换（非浏览器 Fullscreen API），便于查看会话。

## 范围
- 页面：卡片详情页（会话监控页）
- 显示状态：`进行中`、`已阻塞`、`审核中`、`已完成`
- 交互：面板标题右侧增加“全屏/退出全屏”按钮
- 全屏方式：页面内覆盖层（CSS fixed）
- 退出方式：仅标题栏“退出全屏”按钮

## 非目标
- 不引入 Element Plus 组件
- 不新增路由
- 不使用浏览器 Fullscreen API

## 方案概述（选用）
采用 CSS 类切换的页面内全屏方案：给面板外包一层容器，`isFullscreen` 为真时添加 `is-fullscreen` 类，通过 `position: fixed; inset: 0; z-index` 覆盖视口，并锁定 `body` 滚动。

## 组件与结构
- `opencode-panel-wrap`：面板外层容器，负责全屏样式切换
- `session-header`：标题与按钮区域
- `session-iframe`：会话 iframe

## 数据流与状态
- 复用现有 `review.artifacts` 计算 `sessionId` 与 `projectId`
- `sessionUrl` 计算逻辑不变
- 新增本地状态 `isFullscreen: boolean`
- 进入全屏：
  - `isFullscreen = true`
  - `document.body.style.overflow = "hidden"`
- 退出全屏：
  - `isFullscreen = false`
  - 清理 `document.body.style.overflow`

## 显示条件
- 面板显示：当前卡片状态属于 `进行中/已阻塞/审核中/已完成`
- 全屏按钮：仅当 `sessionUrl` 存在时显示

## 错误与边界处理
- `sessionUrl` 为空：显示“暂无会话”，隐藏全屏按钮
- iframe 加载失败：保持默认浏览器错误展示（不新增自定义错误视图）

## 样式与布局
- 常规模式：保持现有布局与高度
- 全屏模式（`is-fullscreen` 类）建议：
  - `position: fixed; inset: 0; z-index: 999; background: #0b0b0b;`
  - 头部固定在顶部
  - iframe 高度：`calc(100vh - headerHeight)`
- 退出全屏时恢复原有样式

## 测试策略
- 单元/组件测试：
  - `sessionUrl` 为空时不渲染全屏按钮
  - 切换 `isFullscreen` 时容器类名与按钮文案正确
- 视图快照（如已有）：更新快照

## 风险与回滚
- 全屏模式可能影响页面滚动：通过 body overflow 锁定与清理控制
- 若出现样式冲突，可通过移除 `is-fullscreen` 类回滚至旧布局
