# Symphony Kanban 内置标签与工作流设计稿

日期：2026-03-18

## 背景与目标
- 新增 4 个内置标签与工作流：UserStory、Bugfix、CodeReview、Refactor。
- 内置标签与工作流 **可修改但不可删除**。
- 当前“标签与工作流”未被 Symphony 执行层使用；需要把标签/流程要求“带下去”给 Symphony 的工作流执行（运行器 prompt）。
- 保持现有“按状态驱动”的调度机制（Todo -> InProgress -> Review/Blocked/Done）。

## 范围
- API 启动时补齐内置标签与工作流（若不存在）。
- API 禁止删除内置标签。
- Symphony scheduler 在领取 Todo 任务时拉取标签/工作流定义并注入运行器上下文。
- 不改变现有 issue 状态机，仅增强上下文输入。

## 内置标签与工作流定义（默认值，可被用户修改）

### 1) UserStory
**Tag.name**: `UserStory`

**rules**
- 明确用户画像与目标（Who/What/Why）。
- 每个 story 聚焦一个主价值，避免混杂多个需求。
- 需要可验证的验收标准与边界条件。

**acceptanceCriteria**
- Given/When/Then 格式列出 3-5 条关键场景。
- 覆盖正向路径、至少 1 条边界或异常路径。
- 明确业务文案与关键交互。

**workflow_def**
- state: `Todo`
- behavior: `story-spec`
- configJson: `{ "checklist": ["用户目标清晰", "范围明确", "验收标准完整"] }`

### 2) Bugfix
**Tag.name**: `Bugfix`

**rules**
- 明确复现步骤、预期 vs 实际结果。
- 判断影响面与优先级（是否回归、是否阻塞）。
- 修复需最小化副作用，避免改动过大。

**acceptanceCriteria**
- 至少 1 个可重复的复现步骤。
- 提供修复前后的对比说明或证据。
- 若影响测试，需要补充或更新测试。

**workflow_def**
- state: `Todo`
- behavior: `bugfix`
- configJson: `{ "checklist": ["复现清晰", "根因分析", "验证修复"] }`

### 3) CodeReview
**Tag.name**: `CodeReview`

**rules**
- 关注正确性、边界条件、性能与可维护性。
- 明确风险点与潜在回归。
- 如需修改，提出具体建议而非笼统评价。

**acceptanceCriteria**
- 列出至少 3 条具体 review 发现或明确说明“无明显问题”。
- 对每个发现给出建议或修复方案。
- 标记优先级（P0/P1/P2）与风险等级。

**workflow_def**
- state: `Todo`
- behavior: `code-review`
- configJson: `{ "checklist": ["正确性", "边界条件", "可维护性"] }`

### 4) Refactor
**Tag.name**: `Refactor`

**rules**
- 不改变外部行为（除非明确说明）。
- 保持可读性提升为核心目标。
- 小步改动，避免大范围重写。

**acceptanceCriteria**
- 说明重构前后的可读性/结构改善点。
- 保持现有测试通过（或补充测试）。
- 明确说明未改变业务行为。

**workflow_def**
- state: `Todo`
- behavior: `refactor`
- configJson: `{ "checklist": ["行为保持", "结构改进", "测试验证"] }`

## 设计方案

### 架构
- API 启动时执行一次幂等初始化：确保内置标签与其 workflow_def 存在。
- 标签删除接口加保护，禁止删除内置标签。
- Symphony scheduler 在领取任务后获取标签/工作流定义并注入运行器上下文（prompt）。

### 组件变更
- API: 启动初始化逻辑（tags/workflow_defs 补齐）。
- API: 删除标签时拦截内置标签。
- Symphony: scheduler 增加“拉取 workflow context 并注入运行器”的步骤。

### 数据流
1. API 启动 → 检查 tags/workflow_defs 是否已有内置项 → 缺失则插入。
2. Scheduler claim Todo → 获取 issue → 获取 tags/workflows → 过滤内置标签 → 组装工作流上下文 → 注入 runner。

### 错误处理
- 初始化失败：记录错误日志，不中断服务（可后续再补齐）。
- workflow 上下文拉取失败：继续执行，但 prompt 中提示“workflow 未加载”。
- 删除内置标签：返回 409 或 400（错误码 `builtin_tag_protected`）。

### 测试
- API：验证初始化补齐与不可删除。
- Symphony：验证注入 workflow context 的逻辑（mock API）。

## 非目标
- 不修改现有状态机与调度策略。
- 不引入新的配置文件或迁移脚本。
