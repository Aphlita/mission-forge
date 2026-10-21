# 贡献指南

## 提出任务

通过[新建 Issue](https://github.com/processmission/mission-forge/issues/new/choose) 选择实践任务提议、问题报告、改进建议或参与求助表单。提出实践任务时填写以下信息：

- 项目方向：Zephyr、Linux 或 Yocto。
- 问题背景：实际需求、已有问题链接和相关技术资料。
- 任务目标：需要实现的行为、涉及的范围和交付内容。
- 实践条件：所需知识、设备、开发环境和上游版本。
- 验收条件：运行步骤、预期结果和需要提交的验证证据。
- 协作安排：参与者、导师及计划时间；尚未确定的信息标记为待确认。

开始任务前，由参与者与导师在 Issue 中确认范围和验收条件。

## 申领任务

1. 在开放的 Issue 中按 `kind/task` 和项目标签筛选任务，阅读任务正文、Assignees 和最新讨论，确认导师已说明可以申领。
2. 在原任务下发表评论，介绍相关经验、可参与时间、开发条件和对任务的理解。
3. 导师在评论中确认参与者、任务范围、验收条件、指导安排和约定目标。
4. 维护者将参与者的 GitHub 账号设置为 Assignee，并在任务正文记录申领日期、导师、约定目标和确认评论链接。以这条确认记录作为申领依据。

申领通过 Issue 评论与 Assignee 完成。实际代码或文档修改通过对应仓库的 Pull Request 或上游规定的补丁流程提交。

```markdown
### Participation request / 参与申请
- Relevant experience / 相关经验：
- Available time / 可参与时间：
- Development environment / 开发条件：
- Task understanding / 对任务的理解：
- Guidance needed / 需要的指导：
```

导师与维护者确认时使用以下记录：

```markdown
### Task assignment / 任务申领确认
- Participant / 参与者 GitHub 用户名：
- Mentor / 导师 GitHub 用户名：
- Claim date / 申领日期：
- Scope and goals / 任务范围与约定目标：
- Acceptance criteria / 验收条件：
- Communication / 沟通安排：
- Application / 参与申请评论链接：
```

多人协作时，导师明确各自负责的内容，维护者添加相应 Assignees。已有人承担的任务，由导师确认协作安排后再增加参与者。

参与者暂停或退出时，在原任务中记录成果、阻碍与交接资料。维护者根据实际责任更新 Assignees 和任务正文，并注明是否开放申领。

## 提交成果

上游代码遵循对应社区的贡献流程。本仓库接收课程资料、任务说明、实践记录和培养文档的修改。

提交本仓库的 Pull Request 时，说明内容用途，关联任务 Issue，并提供适用的验证结果。贡献记录应包含上游提交或讨论链接、当前评审状态、使用的版本和实际测试结果。

提交公开记录前，检查其中的个人信息、访问凭据和内部资料。薪酬协议及个人联系方式通过组织者指定的私有渠道处理。

进展更新、成果提交、导师评估与组织者复核均记录在原任务评论中，使用[任务评论模板](docs/research/mfcp-issue-design.md#任务评论模板)。维护者在任务正文维护最新进展和评估评论链接。阶段评估通过后继续执行任务，最终验收与组织者复核通过后关闭任务。

## 更新培养记录

项目长期资料放入 `projects/<project>/`，每期安排与成果放入 `programs/<year>/`。每期记录引用项目资料，标注评估日期和贡献当时的状态。
