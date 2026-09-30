# 续订清单 UX Contract

## Evidence and scope

本次为现有单页 uni-app 的 UI 重构，依据 subscription/docs/前后端联调说明.md、subscription/api/subscriptions.js、subscription/pages/subscription/subscription-remote.js。
微信小程序使用 uni.login 和后端 code2Session 建立账号会话；微信订阅消息已接入用户授权及发送记录；会员支付尚未开放，账号额度页面只展示后端状态。

## Canonical UI Map

| Capability     | Canonical owner                 | Source of truth              | Allowed variants         | Verification            |
| -------------- | ------------------------------- | ---------------------------- | ------------------------ | ----------------------- |
| Select/Listbox | uni-app picker                  | SubscriptionFormView.vue     | 平台选择器               | H5 打开与取消           |
| Date           | uni-app picker                  | SubscriptionFormView.vue     | 日期、时间               | 小程序编译              |
| Form           | SubscriptionFormView.vue        | subscription-page-logic.js   | 新增、编辑               | 草稿返回与接口测试      |
| Scrollbar      | styles/\_ledger.scss            | DESIGN.md                    | 页面纵向、筛选横向       | 390px 截图              |
| Toast          | uni.showToast / uni.showLoading | subscription-remote.js       | 信息、失败、忙碌         | 接口回归测试            |
| CRUD           | subscription-remote.js          | api/subscriptions.js         | 服务端确认写入           | 实际 Nest HTTP 集成测试 |
| Navigation     | SubscriptionTabBar.vue          | pages/subscription/index.vue | 五标签、详情返回         | H5 点击与键盘           |
| Sort           | SubscriptionSortSheet.vue       | subscription-page-logic.js   | 显式选中、关闭、焦点循环 | H5 键盘验证             |
| Empty state    | EmptyStateView.vue              | SubscriptionListView.vue     | 未添加、无匹配           | 搜索空态                |
| Async state    | AsyncStateView.vue              | subscription-remote.js       | 首次失败、过期数据、统计 | API 与浏览器状态测试    |
| Authentication | api/auth.js + api/request.js    | 后端 auth 全局守卫           | 微信自动登录、过期重登   | 登录与 HTTP 隔离测试    |

路径均相对 subscription/components/subscription，除明确标明 pages、styles 或 api 者。

## Dataset and navigation policy

API 分页拉取完整数据供统计；列表仅分批渲染，加载更多属于本地显示操作。
搜索、分类、状态在父页内保持；切换标签后仍保留。单路由小程序不将这些状态写 URL。
新增、编辑和详情沿现有返回栈操作。接口错误不清空表单；离开修改过的表单须确认。
金额隐藏继承服务端设置；额度、会员状态、订阅状态和月均支出字段以后端返回值为准。

## Async and recovery

初次加载为占位内容；初次失败显示原因和重试；后台刷新保留已读数据并明确标注内容可能不是最新状态。
统计失败有单独重试。保存期间锁定提交按钮并保持按钮尺寸；保存错误保留草稿。写请求在断网或超时时不自动重发，界面要求重新读取以确认结果。
服务端错误显示可执行的中文说明；有 `requestId` 时显示参考编号，供日志定位。字段错误保留在表单内，页面级错误使用 AsyncStateView。
现有 uni-app 遮罩、模态、选择器沿用平台键盘和焦点行为；H5 按钮具备焦点环。

## Verification and migration ledger

微信通知复用首页提醒横幅、SettingsRow 和原生订阅授权弹窗。模板从服务端读取，在用户点击的同步调用链中申请授权。
授权提交失败保留带唯一编号的记录，刷新时重试相同编号；跨账号不提交旧记录。允许、拒绝、永久拒绝与发送成功、失败、未知分别显示。
“我的”提供增加授权、暂停/恢复和发送记录。金额未知的记录必须补充金额才能发送微信通知；每条消息使用一次授权。
点击消息按订阅 ID 打开详情，旧账期提示当前展示的是最新数据。

微信登录在首次读取前执行；并发请求共享同一次登录。登录凭证由后端签发，AppSecret 和微信 session_key 不进入小程序。
令牌过期或读取返回 401 时重新登录，读请求最多重试一次；写请求不自动重发，保留表单并提示重试。
所有用户资源以服务端验证后的身份隔离，不接受 x-demo-user-id。登录失败使用现有 AsyncStateView 和重新加载按钮；换账号时清除上一账号页面数据和草稿。

保留现有 API 与业务测试；执行 Vue/Sass 编译、designmd lint 和 premium strict audit。
运行与交互证据记录在 subscription/docs/ui-verification.md；未完成检查必须列明，不视作通过。
从层叠样式迁移为 token + 主样式文件；新增 UI 复用既有组件，不再追加重复页面主题。

## 本地演示逻辑退役

订阅和设置不再持久化到设备，也不读取旧演示缓存。新账号为空列表；断网只提示错误或展示上次读取的数据，不生成示例记录。
本地只保留登录会话、待确认的通知授权回执及未提交表单。换账号清除页面订阅、草稿、筛选、额度和通知状态，写入前再次核对身份。
移除模拟会员写接口、价格和未实现的周报开关；账号额度页面使用 SettingsRow 展示后端额度。线上只允许 PostgreSQL 持久化，内存仓库仅供开发和自动化测试。
通知状态失败单独显示重试入口，不阻断订阅列表和设置读取。
