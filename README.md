# KOL 招募自动化系统

这是一套可在 Windows 本地部署的 KOL 招募自动化系统，用于表单收集、自动评分、自动分层、联系话术生成、跟进提醒和数据看板。

## 从 GitHub 获取并安装

1. 点击仓库右上角 **Code → Download ZIP**，下载后完整解压到本地文件夹；也可以使用 Git 克隆仓库。
2. 安装 Node.js 20 LTS 或 22 LTS（推荐 22 LTS）。
3. 准备一个 Google Sheet。
4. 准备一个 Google 服务账号 JSON，并启用 Google Sheets API。
5. 把 Google Sheet 共享给服务账号邮箱，权限设为“编辑者”。
6. 准备一个 SMTP 邮箱和应用专用密码。
7. 双击 `一键安装配置.cmd`，按照提示填写信息。
8. 安装器会自动安装 n8n、初始化 Google Sheet、生成并导入工作流。
9. 安装完成后打开 `http://127.0.0.1:5678` 查看工作流。

> 请先完整解压再运行，不要直接在 ZIP 压缩包预览窗口中启动脚本。

也可以使用 Git 克隆：

```bash
git clone https://github.com/liu147203-bit/KOL-Recruitment-Automation-System.git
```

> 本项目是本地部署工具，不是无需配置即可访问的在线网站。每个使用者都必须使用自己的 Google 与邮箱凭证。

## 工作流

- `公司名 KOL - Form Intake Automation`：每 5 分钟扫描新 KOL，自动评分、分层、写库、生成话术。
- `公司名 KOL - Daily Follow-up Reminder`：每天 10 点汇总当天需要跟进的 KOL。
- `公司名 KOL - Weekly Dashboard Report`：每周五 18 点发送数据看板摘要。

## 主要表格

- `Form Responses`：KOL 表单回复入口。
- `KOL Database`：KOL 总库，包含评分、分层、话术、跟进状态。
- `Follow-up Tracker`：跟进任务表。
- `Scoring Rules`：评分规则说明。
- `Dashboard`：提交人数、有效 KOL、A/B/C 数、联系成功率、合作转化率、注册数、任务完成数。

## 正式使用

推荐创建 Google Form，然后把表单回复绑定到同一个 Google Sheet。表单字段请参考 `操作手册.md`。

暂时不用 Google Form 时，也可以把 KOL 数据直接填入 `Form Responses`，保持 `n8n处理状态` 为空。n8n 会自动处理空状态的新行。

## 启动与停止

- 启动：双击 `start-n8n.cmd`。
- 停止：右键使用 PowerShell 运行 `stop-n8n.ps1`。
- 本地访问地址：`http://127.0.0.1:5678`。

## 邮件提醒

邮件提醒功能已经配置在工作流中。只要 SMTP 邮箱信息正确，并且公司网络允许连接 SMTP 端口，邮件会自动发送。

如果邮件节点显示 `smtp timeout` 或 `queryA ETIMEOUT`，说明当前网络无法连接 SMTP 服务器。此时不会影响入库、评分、分层、话术和看板。详见 `邮件提醒功能说明.md`。

## 安全说明

仓库不包含任何密钥。安装过程中生成的以下内容已被 `.gitignore` 排除，不要提交或外传：

- `config.local.json`
- `runtime/private/`
- `runtime/n8n-data/`
- `logs/`
- `*.local.json`
- `*.log`

详见 `SECURITY.md`。

## 系统要求

- Windows 10 或 Windows 11
- Node.js 20 LTS 或 22 LTS
- 可访问 npm、Google API 和所使用的 SMTP 服务
- Google Sheet 编辑权限
