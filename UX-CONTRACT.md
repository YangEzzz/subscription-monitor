# 续订清单 UX Contract

## 模拟会员购买

业务依据：`deploy/模拟会员支付.md`、`subscription/docs/会员功能设计.md` 与服务端 MembershipPaymentsService。`MembershipView.vue` 使用现有 SettingsRow、AsyncStateView 和 tokens，模拟收银台是同页展开区域，不是模态框。提交期间锁定操作，错误在 AsyncStateView 中提供刷新入口；订单与会员状态以服务端读取结果为准，不由客户端支付结果直接修改。撤销测试权益用页面内两步确认，显示数据保留及无实际退款说明。

本人订单和购买状态由 `membership-remote.js` 拥有；请求序号与账号检查阻止旧响应覆盖新账号，账号切换清除订单和幂等请求号。金额、模拟开关、权益来源从后端读取；网络失败后刷新确认，不自动重发支付写请求。页面使用既有颜色和字体，不增加主题。HTML 后台增加只读会员/订单栏目，跨账号只读范围由用户明确授权；写操作仍走本人 Bearer 接口。

## 临时桌面管理后台

本地 HTML 的连接表单由 `backend/public/admin.html` 拥有，复用现有 field、toolbar、message。双击文件自动请求 `https://subscription.yangezzz.top/admin/`，无需密钥；仅在切换后端时使用地址表单。地址支持 HTTPS 管理接口及本机 HTTP，保留代理路径前缀；验证错误关联字段并聚焦。`file://` 下不写 history，查询与 HTTP 页面共用 load/get/render 和取消过期请求机制。权限依据 `deploy/临时管理后台.md` 与 `backend/src/admin/admin.module.ts`：用户明确选择无鉴权的只读文件访问，跨域允许 Origin null，默认关闭管理服务。

`backend/public/admin.html` 是独立原生 HTML 界面，复用 `_tokens.scss` 的颜色和字体镜像，不依赖 uni-app 的平台组件。原生 select 接受操作系统弹窗；table 为语义表格，由表格区域承担水平滚动，文档承担纵向滚动。所有查询共享 load、message、paging 和 render 函数；错误、空态、加载占用稳定表格区域。搜索显式提交、支持中文输入、清除立即查询，AbortController 与序号忽略旧响应。HTTP 页面筛选和页码存 URL，本地文件页面保留在内存；搜索不涉及秘密凭证。第一版只有读取，不提供写入或外部副作用。后台查询由独立管理服务器提供，本地文件可通过HTTPS 转发访问，默认禁用，部署见 `deploy/临时管理后台.md`。

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
“我的”根据服务端授权类型显示一次性授权次数或长期授权状态，并提供暂停/恢复和发送记录。长期授权发送后保留，模板变更后须重新授权；拒绝或微信返回 43101 时停用。金额未知的记录必须补充金额才能发送微信通知。业务配置来源见 deploy/微信通知部署.md。
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
旧本地模拟会员写接口和未实现的周报开关已移除；新模拟支付使用显式后端开关、服务端订单和账号权益，见上述独立购买契约。线上只允许 PostgreSQL 持久化，内存仓库仅供开发和自动化测试。
通知状态失败单独显示重试入口，不阻断订阅列表和设置读取。

## 首页加载并发

登录完成后通知状态与订阅、设置、额度、模板和待办并发请求。核心数据完成即可显示首页，不等待通知与统计。统计使用服务端默认币种并发读取三个周期；通知单独提供读取状态、错误与授权禁用态。请求编号和账号校验阻止旧通知或统计回写。分页仍依据 hasMore 顺序读取。
