---
# SPDX-FileCopyrightText: Copyright (c) 2026 Process Mission
# SPDX-License-Identifier: MIT
name: mfcp-create-issue
description: 为 processmission/mission-forge 创建或起草 GitHub Issue，严格使用仓库当前的实践任务、问题报告、改进建议或参与求助表单。用户要求向 MFCP 发布任务、报告问题或提出建议时使用。
---

# MFCP Issue 创建

目标仓库固定为 `processmission/mission-forge`。使用远端默认分支的当前表单与规则；所有字段由真实资料支持。

## 选择入口

| 意图 | 模板 |
| --- | --- |
| 发布实践任务 | `01-task.yml` |
| 报告 MFCP 资料或流程问题 | `02-bug.yml` |
| 提出资料或培养流程改进 | `03-improvement.yml` |
| 参与流程或技术求助 | `04-question.yml` |

任务申领、进展、成果提交、导师评估和组织者复核使用原任务评论。读 `CONTRIBUTING.md` 确认当前要求；用户明确要求发布评论时才发送。上游缺陷按上游流程处理，MFCP 可以记录相关实践任务。请求创建独立评估 Issue 时，说明现行评论流程。

## 读取与准备

1. 使用 GitHub 连接工具读取目标仓库信息、默认分支的 `CONTRIBUTING.md`、`docs/levels.md`、`.github/labels.json` 和选定表单。优先使用连接工具检索开放与关闭的相关 Issue；缺少所需能力时使用 `gh api`。找到已有同一任务时读取其正文和评论，避免重复创建。
2. 本技能的 `scripts/prepare.rb` 使用已认证的 GitHub CLI 获取默认分支提交，并从该提交读取表单和标签目录。运行 `--inspect` 查看真实字段、说明、必填标记和选项。需要 Ruby、Psych YAML 库及 GitHub CLI；缺少依赖时安装对应依赖或说明阻碍。
3. 在当前工作目录创建本次专用的中间目录；位于 Git 仓库时先加入 `.git/info/exclude`。使用文件编辑工具写入答案 JSON，以表单字段 `id` 为键。单选为选项完整原文字符串，多选为完整原文字符串数组，文本字段为字符串。只使用所选表单的字段。
4. 根据用户已提供的信息、仓库资料和真实问题记录填写字段。未知的必填事实集中询问用户，保持草稿。待评定难度使用表单的对应选项，并说明需要导师判断的内容；导师未确定时按表单要求填写需要的指导。可选字段可以省略。保留原始语言，用户可以用中文或英文回答。

技能随仓库保存在 `.agents/skills/mfcp-create-issue/`。命令中的技能目录使用本次实际加载的目录：

```sh
ruby <skill-dir>/scripts/prepare.rb --template 01-task.yml --inspect
ruby <skill-dir>/scripts/prepare.rb --template 01-task.yml --answers <draft-dir>/answers.json --title '具体任务标题' --output <draft-dir>/prepared
```

脚本输出 `body.md`、`issue.json` 和 `source.json`。脚本校验必填字段、选项、字段标识符和默认标签，按表单顺序生成 `### 原字段名称` 与回答。未填写的可选字段显示 `_No response_`。正文保留表单实际字段；表单介绍文字作为操作指引阅读。标题采用表单的 `title` 前缀。

## 标签与权限

- 新建时使用模板声明的默认标签。项目下拉选项进入正文，项目标签由维护者确认后添加。
- 难度选择表示建议。导师确认任务难度、维护者设置 `difficulty/level0` 至 `difficulty/level4` 的要求以当前文档为准；创建操作只携带模板默认标签。
- Assignee 在导师确认任务申领后设置。创建时不推断负责人、导师授权、Milestone 或额外标签。
- 用户要求起草时交付草稿。用户明确要求创建该 Issue，且必填事实齐备时可以提交，无需重复确认。泛泛讨论、调用本技能或生成草稿不构成发布授权。

## 校验与发布

1. 审阅 `body.md`：字段顺序与表单一致，标题具体，事实有依据，公开内容不含凭据、私人联系方式或薪酬协议。脚本的格式校验不能代替事实核对。
2. 发布前检查当前默认分支的表单和标签目录与 `source.json` 记录的版本是否一致，并核对远端标签仍存在。若内容改变，重新准备草稿并检查新增必填条件；其他无关文件的更新无需重新准备。
3. 再次查询近期相关 Issue。存在等价记录时向用户返回该记录，保留当前草稿；用户明确要求独立事项时按其范围处理。
4. 优先调用 GitHub 创建 Issue 工具，目标固定为 `processmission/mission-forge`，传入 `issue.json` 的标题、正文与标签。使用 CLI 时执行 `gh api repos/processmission/mission-forge/issues --method POST --input <draft-dir>/prepared/issue.json`。API 不会替调用者执行网页表单必填检查，因此必须先通过准备脚本。
5. 创建请求超时或返回结果不明时，先查询当前用户近期创建的 Issue，核对标题和完整正文。找到匹配项就读取并返回它；结果仍不明时停止自动重试，说明状态与草稿位置，避免重复发布。
6. 创建成功后读取该 Issue，核对目标仓库、标题、正文与默认标签，返回真实链接。读取不一致时说明具体差异，再按原授权修正。验证本技能时使用只读查询和本地草稿，保持远端 Issue 列表不变。
