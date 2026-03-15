---
title: 为什么我想做一个 Symphony Kanban：AI coding 的瓶颈已经不是写代码了
date: 2026-03-15
tags: [Symphony, Vibe, Insight, Kanban, AI 工作台]
status: draft
---
# 为什么我想做一个 Symphony Kanban：AI coding 的瓶颈已经不是写代码了
这段时间我一直在看两类产品：一类是 OpenAI 开源的 Symphony，另一类是 Vibe Kanban 这样的 AI agent 工作台。
表面上看，它们不是一回事。
Symphony 更像一个面向任务编排和自动执行的后端系统；Vibe Kanban 更像一个把 AI coding agents 组织起来的前端工作台。
但看得越多，我越确定一件事：**AI coding 的下一阶段，瓶颈已经不是“写代码”本身，而是“怎么管理这些正在写代码的 agents”。**
这也是我为什么会想做一个 **Symphony Kanban**。
我不是想再做一个“更聪明的 coding agent”，也不是想做一个套在终端外面的漂亮 UI。我真正想做的，是一个面向个人场景的 **AI 工作台**：它能接住任务、组织工作流、管理 workspace、展示执行状态，并把人的时间重新放回规划、审查和判断，而不是浪费在盯终端和等待 agent 输出上。
如果要把这篇文章压缩成一句话，那就是：
> **AI coding 的核心问题，正在从“如何生成代码”转向“如何组织交付”。**
而 Symphony 和 Vibe Kanban，刚好分别回答了这个问题的两半。
## 瓶颈为什么变了
在过去的开发流程里，最大的约束通常是实现速度：
- 需求能不能很快写出来；
- 功能不能很快做完；
- bug 能不能很快修掉。
但当 Claude Code、Codex、Gemini CLI、OpenCode 这类工具越来越强之后，一个很明显的变化出现了：**写代码本身正在变得越来越便宜，真正贵的是你的注意力。**
你会开始遇到另外一类问题：
- 这几个任务应该怎么拆，才能并行跑？
- 哪个任务该交给哪个 agent？
- 任务做到一半卡住了，我要不要介入？
- 这个结果真的算完成了吗，还是只是“看起来像完成了”？
- 多个 agent 同时改代码时，怎么避免上下文打架、分支混乱、状态失控？
这时候你会发现，新的瓶颈不再是“AI 会不会写”，而是：
- **任务如何被组织**
- **工作如何被调度**
- **执行如何被看见**
- **结果如何被审查**
- **人类如何只在关键点介入**
这也是为什么，我越来越觉得“聊天框”不是 AI coding 的最终界面。
聊天框适合提问、适合探索、适合一次性协作，但它不适合承载一整条长期、并行、可回溯、可审查的交付流程。真正进入工程现场之后，你需要的不是一个会说话的助手，而是一套能管理工作的系统。
## Symphony 真正让我看到的，不是 agent，而是 workflow
OpenAI Symphony 最打动我的地方，不是它又提供了一个新的 agent runtime，而是它把“任务”重新定义成了系统中心。
从公开资料和相关讨论里，Symphony 的核心不是对话驱动，而是 **issue-driven orchestration**：
- 它从 issue tracker 出发；
- 它把任务拉进一个明确的生命周期；
- 它把执行、审查、合并组织成可推进的状态机；
- 它要求交付必须带着 proof of work 一起出现。
这个思路很重要，因为它意味着：
**真正该被管理的不是 agent，而是 work。**
Symphony 官方描述里最关键的一句话，恰就是这句：
> manage work instead of supervising coding agents
这句话几乎把方向讲透了。
过去我们使用 coding agent 的方式，很多时候还是“盯着它干活”。你发 prompt，它开始跑；你看它输出；你纠正它；你继续盯。
但一旦任务开始变多、agent 开始并行，这种方式就会迅速崩掉。因为你实际上是在用人脑模拟一个调度系统。
Symphony 的启发在于，它不让人继续亲自扮演调度器，而是直接把任务放进状态机：
- 任务可以被 claim；
- 任务可以被 dispatch；
- 任务可以被 review；
- 任务可以被 merge；
- 任务的结果要附带 CI、PR review、complexity analysis、walkthrough 这类 proof of work。
这件事对我影响非常大。
因为它让我越来越确信：一个合格的 AI 工作台，绝对不能只显示“agent 说自己完成了”，而必须显示：
**它为什么算完成了，它交付了哪些证据，它现在处于哪个状态，下一步该由谁接手。**
换句话说，Symphony 给我的不是一个功能点，而是一种方法论：
**把任务当成状态机，而不是把聊天当成主界面。**
## Vibe Kanban 真正让我看到的，是 planning 和 review 才是新主场
如果说 Symphony 给了我 workflow 骨架，那么 Vibe Kanban 给我的启发就是另一半：**人应该待在哪里。**
Vibe Kanban 的产品表达很直接。它不断重复一个判断：
> The new bottleneck is planning and review.
我非常认同这个判断。
当 coding agents 逐渐能并行工作时，人类最有价值的能力就不再是“亲手敲下第一行实现代码”，而变成了：
- 先把任务定义清楚；
- 决定先做什么、后做什么；
- 判断哪个结果值得通过；
- 在最少介入的前提下，维持整体质量和方向正确。
Vibe Kanban 最有价值的地方，不在于它把 agent 放进了看板，而在于它把工作重心从“持续提示 agent”转成了：
- planning
- workspace
- diff review
- 并行执行
- 状态可见
这是一个非常重要的转向。
因为它意味着，AI coding 的核心界面，已经不该再是一个“更丝滑的 prompt 窗口”，而更应该是一个 **workbench**：
- 任务可以排布；
- workspaces 可以隔离；
- diff 可以审查；
- session 可以切换；
- 多个 agents 可以并行推进。
尤其是 workspaces 这个概念，我觉得非常关键。
Vibe Kanban 的 workspaces 不是一个简单的文件夹抽象，而是一个真正的任务执行容器：它包含代码仓库、会话、修改、测试、diff、PR 提交等动作。这一点和我自己现在对产品的理解高度一致——未来的 AI 工作台，不应该只有 task list，它必须同时理解 **workspace 作为执行单位** 的意义。
## 当我把 Symphony 和 Vibe Kanban 放在一起看时，我看到的是一条完整链路
单看 Symphony，你会觉得它更偏系统编排；
单看 Vibe Kanban，你会觉得它更偏工作台体验。
但把它们放在一起，我看到的不是“两个产品可以互相借鉴”，而是一条更完整的交付链路：
- 用看板接住任务；
- 用 workflow 推进任务；
- 用 workspace 承接执行；
- 用 proof of work 支撑验收；
- 用 review 作为人类介入的核心动作。
这条链路，恰好对应了我想做的 Symphony Kanban。
我现在越来越清楚，这个产品不该是“一个 UI 套壳的 coding agent”，也不该是“一个复杂但没人愿意用的 orchestration backend”。
它应该是一套分层清晰的工作系统：
- 前端看板负责 Issue、Tag、Workspace 的组织；
- API 后端负责数据落盘和标准 CRUD；
- 编排层负责拉取任务、推进 workflow、调度执行；
- 执行层负责无状态地完成 agent 动作。
重点不在于架构图画得多漂亮，而在于不要把看板、存储、调度、执行混成一锅。
**只有解耦，AI 工作台才可能既稳定又可扩展。**
## 这篇文章真正想表达的，不是“我又发现了一个好工具”
如果只是想介绍 Symphony 或 Vibe Kanban，这篇文章完全可以写成一个产品观察笔记。
但我更想表达的，其实是一个立场：
**下一阶段的 AI coding 竞争，不会只发生在模型层，也会发生在 workflow 层、review 层、workspace 层。**
谁更早把这些东西组织起来，谁就更可能真正把 AI 变成稳定生产力，而不是一个时灵时不灵的助手。
所以我想做 Symphony Kanban，不是因为我想追一个热点，而是因为我越来越相信下面三件事：
第一，**只靠模型升级解决不了协作问题。**
模型会继续变强，但任务拆解、并行管理、状态同步、结果审查这些问题，不会自动消失。
第二，**workflow、review、workspace 会成为 AI-first 开发的新基础设施。**
未来真正高效的团队，不一定是 prompt 写得最花的人，而是最先把工作流组织好的人。
第三，**人类最应该保留的，不是重复执行，而是规划、判断和审查。**
我并不想让 AI 替我工作到我什么都不看；我更想要的是一个系统，让我可以更少地盯过程、更准地抓关键点、更高效地管理多个 AI 执行单元。
这就是为什么 Symphony 和 Vibe Kanban 对我有意义。
它们不一定是最终答案，但它们很清楚地指出了两个方向：
- 一边是任务驱动、状态驱动、proof-of-work 驱动；
- 一边是 planning-first、review-centric、workspace-oriented。
而我想做的产品，正好站在这两条线的交汇处。
## 我接下来会继续写什么
这篇文章只是系列的起点。
接下来我更想把三件事写透：
第一篇，是产品篇：**Symphony Kanban 的核心特性到底是什么。**
第二篇，是流程篇：**从洞察到需求，再到架构与开发，这条链路怎么真正跑通。**
第三篇，是落地篇：**第一版 MVP 的设计取舍、实现方式和踩坑。**
如果这几篇都能写清楚，那么 Symphony Kanban 就不再只是一个“感觉不错的方向”，而会慢变成一个真正可执行的产品方法。
## 参考链接
- OpenAI Symphony：<https://github.com/openai/symphony>
- Symphony 工作流与状态机讨论：<https://github.com/NousResearch/hermes-agent/issues/404>
- Vibe Kanban 文档：<https://vibekanban.com/docs>
- Vibe Kanban 产品主页：<https://vibekanban.com/>
- Vibe Kanban Workspaces：<https://vibekanban.com/docs/workspaces>
- Vibe Guide：<https://www.vibekanban.com/vibe-guide>
- Vibe Kanban 行业分析：<https://virtuslab.com/blog/ai/vibe-kanban/>
- HN 社区讨论：<https://news.ycombinator.com/item?id=44533004>
