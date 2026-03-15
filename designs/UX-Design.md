---
title: UX 设计：Symphony Kanban 个人 AI 工作台体验与设计规范
date: 2026-03-15
tags: [Symphony, Kanban, UX, Design System, AI 工作台]
status: draft
---

# UX 设计：Symphony Kanban 个人 AI 工作台

基于对产品洞察与需求文档的分析，Symphony Kanban 的核心设计目标是实现从“聊天驱动（Chat-driven）”到“任务驱动（Issue-driven）与工作流编排”的范式转移。本系统不是一个终端界面的外壳，而是一个统筹任务、管理 Workspace 状态和人类 Review 介入的管理中枢。

本设计基于 **UI/UX Pro Max** 的规范，采用数据密集型工作台（SaaS Dashboard）布局，以适配开发者的长时间专注环境。系统提供对 **Dark Mode (OLED)** 和 **Light Mode (Clean Tech)** 的原生支持，使用设计令牌（Design Tokens）确保在双模式下都具备高对比度和一致的视觉层级。

---

## 1. 设计系统 (Design System)

### 1.1 视觉风格 (Visual Style)
- **风格基调**：Dark Mode (OLED) & Light Mode (Clean Tech)
- **核心理念**：高对比度、无干扰、面向开发者（Developer-centric）。以数据和代码展示为核心，去除冗余的渐变与装饰。
- **排版 (Typography)**：
  - **Heading (标题/状态列)**：Space Grotesk 或 Inter（现代、科技感）
  - **Body (正文/描述)**：DM Sans 或 Inter（清晰易读）
  - **Code/Log (代码/日志)**：Fira Code 或 JetBrains Mono（等宽，清晰展示代码和终端输出）

### 1.2 调色板与语义令牌 (Color Palette & Semantic Tokens)
采用支持双主题（Dark/Light）的语义化颜色映射（Semantic Token Mapping）：

| Token 角色 | Dark Mode (OLED) | Light Mode (Clean Tech) | 描述 / 目的 |
| :--- | :--- | :--- | :--- |
| **Background** (应用底色) | `#0B0C10` (极深黑) | `#F8FAFC` (冷白/Slate 50) | 最底层的画布，Dark 极深节电，Light 清新高反差 |
| **Surface/Card** (面板/卡片底色) | `#161B22` (深空灰) | `#FFFFFF` (纯白) | 用于任务卡片、侧边栏、工具栏，形成层级区分 |
| **Border/Divider** (边框/分割线) | `#30363D` (暗灰边框) | `#E2E8F0` (浅灰边框) | 用于界面的物理分割，如列间距，避免使用阴影 |
| **Primary** (主品牌/动作色) | `#3B82F6` (亮蓝) | `#2563EB` (经典科技蓝) | 主要 CTA 按钮、选中状态 |
| **Text Primary** (主文本) | `#F0F6FC` (亮灰白) | `#0F172A` (近黑) | 标题、核心数据（要求 WCAG 7:1+ 对比度） |
| **Text Secondary** (次要文本) | `#8B949E` (中灰) | `#64748B` (石板灰) | 描述、副标题、时间戳 |
| **Success/Done** (成功状态) | `#238636` (柔和绿) | `#16A34A` (鲜绿) | 任务完成、测试通过 |
| **Warning/In Progress** (进行中) | `#D29922` (暗金黄) | `#D97706` (橘黄) | Agent 执行中、编译警告 |
| **Error/Blocked** (阻断/失败) | `#F85149` (明亮红) | `#DC2626` (正红) | 任务阻断、编译报错、执行失败 |

### 1.3 核心体验原则 (UX Guidelines)
- **空间利用**：宽屏优化，支持分屏浏览（左侧 Kanban / 右侧 Workspace）。
- **扁平化设计 (Flat Design)**：无论在 Light 还是 Dark 模式下，都不使用重度投影（Box-shadows）。通过 `Border` 和细微的 `Background` 色差构建层级。
- **即时反馈**：所有状态流转（拖拽卡片、任务启动、日志更新）应具备 150-200ms 的平滑过渡（尊重 `prefers-reduced-motion`）。
- **数据透明**：在不过载的情况下展示“Proof of Work”（执行证据），包括日志缩略图、CI 状态和修改文件数。
- **可达性 (Accessibility)**：
  - 代码与终端区域支持全键盘导航。
  - 所有图标（不使用 Emoji，使用 Lucide 或 Heroicons 矢量图标）均配备 `aria-label`。
  - 动态适配的文本对比度（双端均满足 WCAG AAA 级）。

---

## 2. 核心布局规划 (Core Layouts)

整体应用采用 **全局侧边栏 (Sidebar) + 动态主视图 (Main Content)** 的布局结构。

### 2.1 主导航栏 (Global Sidebar)
- **折叠/展开**：极简侧边栏，包含 Workspace 切换、看板视图 (Board)、Review 队列 (Review Center)、历史归档 (Archive) 和设置 (Settings)。
- **深色视觉隔离**：使用右侧极细的 1px border (`#1E293B`) 与主区域分隔，保持整体界面的整洁。

### 2.2 视图一：任务看板 (The Issue-Driven Kanban)
这是用户的核心入口，展示 AI 任务的全生命周期。

- **列定义 (Columns)**：
  - `Backlog / Todo`：待处理的需求。
  - `In Progress (Agent Running)`：正在被 Symphony 调度或 Opencode Server 执行的任务。卡片上需带有微秒级的呼吸灯或骨架屏（Skeleton），暗示后台运行中。
  - `Review Required`：执行结束，等待人类验收。
  - `Done / Merged`：已合并且确认完成。
  - `Blocked / Failed`：因编译报错或需要确认上下文而中断的任务。
- **任务卡片设计 (Task Card)**：
  - **头部**：任务 ID（如 `SYS-42`）+ 任务标题。
  - **Tag 标记**：彩色的胶囊标签（如 `frontend`, `ci-required`），不仅是分类，还直观展示 Workflow 路由状态。
  - **Proof of Work 缩略信息**：在卡片底部显示执行证据，如 `✓ 3 tests passed`，`⇄ 4 files changed`，或 `⚠️ 1 lint error`。
  - **悬停态**：悬浮（Hover）时显示快速操作（Quick Actions）：如 `Jump to Workspace` 或 `Quick Review`。

### 2.3 视图二：工作区执行态 (The Workspace Execution Container)
当用户点击处于 `In Progress` 或 `Review` 的任务卡片时，看板视图侧滑或展开为分屏，进入 Workspace 视角。

- **三栏式布局 (Three-Pane View)**：
  1. **左侧 - 任务与上下文面板 (Context)**：当前任务详情、引用的仓库路径、绑定的 agent 会话记录（可回放）。
  2. **中间 - 变更与文件树 (Diff & File Tree)**：显示 agent 操作过的文件列表。提供类似于 VS Code 的 Diff View（左右对比或内联对比）。
  3. **右侧 - 终端与执行日志 (Terminal & Logs)**：实时滚动显示 Opencode Server 返回的终端输出。需具备日志高亮（Error/Warning）、自动滚动到最新及“复制日志”功能。
- **状态栏 (Bottom Status Bar)**：明确显示当前 agent 所处的内部状态机节点（例如 `Claiming...` -> `Dispatching...` -> `Running tests...`）。

### 2.4 视图三：审查与介入中心 (Review & Proof of Work Center)
取代传统的“对话窗口”，Review 是整个工作流中人类注意力价值最高的地方。

- **Review 视图核心信息**：
  - **Agent Summary**：Agent 自动生成的“改动总结”（Why & How）。
  - **Diff Preview**：代码修改清单及核心逻辑 Diff。
  - **CI/Test Results**：如果包含 `ci-required` 标签，则必须有测试通过的证据标识。
- **人工决策操作 (Human Actions)**：
  - **Approve & Merge** (主按钮，绿色，推动任务流转到 Done)。
  - **Request Changes / Reject** (次要按钮，红色或黄色，提供输入框供人类补充上下文后退回 `In Progress`)。
  - **Take Over** (接管任务，直接在本地或 IDE 中打开对应的 Worktree 分支)。

### 2.4 视图四：标签工作流蓝图 (Tag Workflow Blueprint)
该视图将 `workflow.md` 的逻辑可视化，允许用户通过 UI 定义 Agent 的“灵魂”。

- **三栏式架构**：
  1. **左侧 - 标签管理器**：管理全局标签（Tags），点击特定标签进入其专属工作流配置。
  2. **中间 - 状态机画布 (Workflow Canvas)**：
     - **状态节点**：如 `Todo`, `In Progress`, `Review`。
     - **行为连接**：定义状态转换时的触发动作（如：进入 Todo 自动执行 `agent.run`）。
     - **生命周期钩子**：在画布上直观展示 `after_create` 和 `before_remove` 的位置。
  3. **右侧 - Agent 配置面板**：
     - **运行时参数**：调节 `max_turns` (步数限制)、`max_concurrent` (并发限制) 和 `model` (模型选择)。
     - **日志模板编辑器**：定义 `Workpad` 自动生成的 Markdown结构。

---

## 3. 核心交互流 (Interaction Models)

### 3.1 任务创建与标签调度
- **流转**：用户通过全局捷径（如 `Cmd + K` 或 `C`）唤起新建任务面板。
- **交互**：输入标题与描述后，系统建议标签（Tags）。用户选中 `ci-required`，界面上即时反馈该任务路径末端将多出一个 `Wait for CI` 节点。

### 3.2 错误阻断与人工恢复 (Blocked State Recovery)
- **场景**：Agent 修改代码后，构建失败，系统自动将卡片移动至 `Blocked` 列。
- **交互**：
  - 看板发出微弱的红光警示。
  - 用户点击卡片进入 Workspace，直接定位到右侧日志面板的报错高亮行。
  - 用户在下方的指令框输入：“修改此类型定义，确保与上游接口对齐”，点击 `Retry`，任务卡片重新进入 `In Progress` 列。

### 3.3 Proof of Work 强制门控 (Gatekeeping)
- **机制**：当拖拽卡片试图从 `In Progress` 直接拖到 `Done` 时，如果系统未能捕获到对应的 Diff 或 Log 证据，拖拽动作将被弹回（Snap back），并提示“缺少执行证据 (Missing Proof of Work)”。

---

## 4. UI 最佳实践审查 (Pre-Delivery Checklist)

为了避免界面显得“像一个随意的网页 Demo”，须遵守以下严格的 UI/UX 标准：

- [x] **禁用 Emoji 结构性图标**：所有面板、侧边栏、状态图标统一使用 SVG (如 Lucide/Heroicons) 确保视觉锐度。
- [x] **极简的卡片投影 (Elevation)**：在纯黑底色上，卡片悬浮不使用模糊大阴影，而是使用 1px 的反差边框（如 `#334155`）配合细微的 `transform: translateY(-2px)` 实现互动反馈。
- [x] **多任务并行可见性**：当多个 Agent 并在跑任务时，不在全局弹遮罩（Modal），而是在侧边栏底部提供一个“正在运行的任务数”全局指示器。
- [x] **响应式与性能**：虽然主要面向桌面端，但面板（Panel）的收起和展开需做到 60fps 平滑，避免切换 Workspace 时的布局抖动 (Layout Shift)。
