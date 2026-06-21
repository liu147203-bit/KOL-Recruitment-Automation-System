# 安全说明

## 可以分发的内容

可以把本文件夹作为“干净安装包”发给客户，但只限首次交付前的原始状态。

可以分发：

- `一键安装配置.cmd`
- `install-and-configure.ps1`
- `start-n8n.cmd`
- `start-n8n.ps1`
- `stop-n8n.ps1`
- `scripts`
- `templates`
- `README.md`
- `SECURITY.md`
- `config.example.json`

## 不能分发的内容

安装完成后，客户电脑上会生成以下私有目录，不要二次打包给别人：

- `runtime/private`
- `runtime/n8n-data`
- `runtime/n8n-local`
- `config.local.json`
- `logs`

这些目录可能包含：

- Google 服务账号私钥
- SMTP 邮箱授权码
- n8n 加密凭证库
- 工作流执行记录
- 公司业务数据

## 每家公司必须使用自己的凭证

不要共用交付方或其他公司的：

- Google 服务账号 JSON
- Gmail/SMTP 应用专用密码
- Google Sheet
- n8n 数据目录

## Google 侧建议

- 为每家公司单独创建 Google Cloud 项目或至少单独创建服务账号。
- 只把目标 Google Sheet 共享给对应服务账号。
- 服务账号权限只给“编辑者”，不要给整个 Google Drive 权限。
- 离职、项目结束或泄露后，立即删除旧 key 并重新生成。

## 邮箱侧建议

- 使用专门的运营通知邮箱，不要使用个人主邮箱。
- 使用应用专用密码，不要使用网页登录密码。
- 若邮件发送失败，优先检查公司网络是否允许 SMTP 465/587 端口。

## 交付方注意

交付前务必确认压缩包里没有：

- `private_key`
- Google private key block
- SMTP 授权码
- 真实邮箱密码
- 真实客户数据
- 交付方自己的 Google Sheet ID
