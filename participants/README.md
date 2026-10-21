# Participant registration / 参与者注册

Register before creating or commenting on MFCP issues. Fork this repository,
add your identity file, and submit a pull request to `main`. A maintainer
reviews and merges the registration. PR discussions remain open during registration.

参与 MFCP Issue 讨论前，先 Fork 本仓库，添加本人身份文件并向 `main` 提交 PR，由维护者审核合并。注册期间可以在 PR 中讨论。

## Create your identity file / 创建身份文件

1. Fork `processmission/mission-forge`，在自己的 Fork 中创建分支。
2. 使用 `gh api user --jq '{github_id: .id, github_login: .login}'` 获取本人身份信息，也可以访问 `https://api.github.com/users/你的用户名` 查看数字 `id` 和 `login`。
3. 将返回的真实数字 ID 和用户名写入 `participants/<数字ID>.json`。文件只包含 `github_id`（数字）与 `github_login`（字符串）两个字段。
4. 提交该文件，将分支推送到自己的 Fork，再向本仓库 `main` 创建 PR。注册 PR 只新增本人身份文件。
5. 在 PR 中处理检查结果和维护者意见。维护者审核合并后，登记生效。

数字 ID 用于识别账号，用户名用于阅读。账号更名后数字 ID 保持登记关联；参与者可以通过只修改本人身份文件的 PR 更新显示用户名。本人身份文件中的信息均公开可见。

Registration is a prerequisite for participation. Contributor levels are assessed
through task outcomes. Registration alone grants no contributor level or repository write access.

注册是参与前置条件。贡献者等级按任务成果评估，注册本身不授予等级或仓库写入权限。

## Issue participation / Issue 参与规则

未注册账号创建或重新打开的 Issue 会自动关闭；未注册账号新建或编辑的 Issue 评论会自动删除。PR 及其讨论保持开放。维护者与参与者均通过身份文件登记。

自动处理在提交后执行，内容可能短暂可见并触发通知。工作流失败或暂停期间可能延迟处理，维护者检查失败运行并重新执行。已删除的评论需要在注册完成后重新发表；已关闭的 Issue 可以在注册完成后重新打开。

登记依据为默认分支中的身份文件。维护者核对 PR 作者、数字 ID 和用户名，确认 `Registration / validate` 检查通过后合并。检查读取 PR 文件内容进行 JSON 校验，执行的代码来自默认分支。维护者应在分支规则中将该检查设为必需，并要求审核后合并。

撤销参与资格时，具有仓库写入或管理权限的维护者提交仅删除身份文件的 PR，经过审核后合并。撤销后，新发表或编辑的评论及新建、重新打开的 Issue 按未注册账号处理。
