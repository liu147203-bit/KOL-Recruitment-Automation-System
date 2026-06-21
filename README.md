# KOL 招募自动化系统

这是一套本地部署的 KOL 招募自动化系统，用于表单收集、自动评分、自动分层、联系话术生成、跟进提醒和数据看板。


## 从 GitHub 获取并安装

1. 打开本仓库首页，点击 **Code → Download ZIP**。
2. 下载后先完整解压到一个固定文件夹，不要直接在压缩包内运行。
3. 推荐使用 Windows 10/11，并安装 Node.js 20 LTS 或 22 LTS。
4. 双击 `一键安装配置.cmd`，按照提示填写自己的 Google Sheet、Google 服务账号和 SMTP 信息。
5. 安装完成后，浏览器会打开 `http://127.0.0.1:5678`。

也可以使用 Git 克隆：

```bash
git clone https://github.com/liu147203-bit/KOL-Recruitment-Automation-System.git
```

> 本项目是本地部署工具，不是无需配置即可访问的在线网站。每个使用者都必须使用自己的 Google 与邮箱凭证。

## 运行环境

- 操作系统：Windows 10/11
- Node.js：20 LTS 或 22 LTS
- 网络：首次安装需要下载 n8n；运行时需要访问 Google Sheets API，邮件提醒还需要可连接 SMTP 端口
- 权限：Google Sheet 必须共享给对应服务账号，并授予“编辑者”权限

## 快速开始

1. 安装 Node.js 20 LTS 或 22 LTS。
2. 准备一个 Google Sheet。
3. 准备一个 Google 服务账号 JSON，并启用 Google Sheets API。
4. 把 Google Sheet 共享给服务账号邮箱，权限设为“编辑者”。
5. 准备一个 SMTP 邮箱和应用专用密码。
6. 解压本安装包，双击 `一键安装配置.cmd`。
7. 按提示填写信息，安装器会自动完成 n8n、Google Sheet 和工作流配置。
8. 打开 `http://127.0.0.1:5678` 查看工作流。

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

如果暂时不用 Google Form，也可以把 KOL 数据直接填入 `Form Responses`，保持 `n8n处理状态` 为空。n8n 会自动处理空状态的新行。

## 邮件提醒

邮件提醒功能已经配置在工作流中。只要 SMTP 邮箱信息正确，并且公司网络允许连接 SMTP 端口，邮件会自动发送。

如果邮件节点显示 `smtp timeout` 或 `queryA ETIMEOUT`，说明当前网络无法连接 SMTP 服务器。此时不会影响入库、评分、分层、话术和看板。详见 `邮件提醒功能说明.md`。

## 安全

安装包不包含任何密钥。安装后生成的 `runtime/private`、`runtime/n8n-data`、`config.local.json` 不要外传。详见 `SECURITY.md`。
