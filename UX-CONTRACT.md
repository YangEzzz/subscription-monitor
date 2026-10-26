# 续订清单 UX Contract

## 订阅详情加载（2026-10-20 用户补充）

退出详情、改选其他订阅及账号清理时，除失效响应序号外，还必须调用原生 RequestTask.abort 释放在途连接。若请求仍在等待会话，取消后不得继续发送。公共请求层仅向微信小程序显式开启 enableHttp2；认证、错误映射、401 读请求一次重试和写请求不自动重发保持原约定。

点击订阅立即进入详情视图并显示骨架屏，详情请求由独立的 detailLoading/detailError/detailRequestId 拥有，不占用全局 refresh 的 loading 状态。请求完成前隐藏缓存详情及操作按钮；成功后展示当前请求返回的数据，失败时保留详情导航与原返回栈，使用 AsyncStateView 提供重新加载。返回、离开详情和账号清理使在途详情请求失效；旧响应不可重新打开页面、覆盖新选择或回写旧账号数据。重试不新增返回栈。骨架复用 UiSkeleton 和全局减少动态效果规则，不引入人为最短等待时间。用户本次明确授权调整详情加载顺序，取代此前“先请求再切页”的实现。

## 2026-10-20 新规范的展示组件适配

用户已确认保留 `pages/subscription/index` 单路由与 `activeView/viewStack`，后续方案 A 的四个导航项和普通新增按钮由现有 SubscriptionTabBar 拥有；统计作为内部二级视图，入口从首页进入并使用既有返回栈，不迁移业务状态至多个 Page。现有请求、筛选、排序、表单、额度、订阅消息、支付与账号隔离保持原所有权。

PageHeader 仅读取屏幕与胶囊位置；UiSelection 仅输出 select，不拥有业务筛选或查询；UiSkeleton 无业务请求。SettingsRow 继续使用 activate / checked-change，subscription-row 继续使用 activate，避免与小程序原生冒泡事件重名。样式可改变布局和语义颜色，不改变状态码、金额与统计口径。公共减少动态效果样式只控制位移与循环动画。

## 模拟会员购买

业务依据：`deploy/模拟会员支付.md`、`subscription/docs/会员功能设计.md` 与服务端 MembershipPaymentsService。`MembershipView.vue` 使用现有 SettingsRow、AsyncStateView 和 tokens，模拟收银台是同页展开区域，不是模态框。提交期间锁定操作，错误在 AsyncStateView 中提供刷新入口；订单与会员状态以服务端读取结果为准，不由客户端支付结果直接修改。撤销测试权益用页面内两步确认，显示数据保留及无实际退款说明。

本人订单和购买状态由 `membership-remote.js` 拥有；请求序号与账号检查阻止旧响应覆盖新账号，账号切换清除订单和幂等请求号。金额、模拟开关、权益来源从后端读取；网络失败后刷新确认，不自动重发支付写请求。页面使用既有颜色和字体，不增加主题。Vue 后台提供只读会员/订单栏目，跨账号只读范围由用户明确授权；写操作仍走本人 Bearer 接口。

## Vue 桌面管理后台

基础控件由 `admin/components.json` 配置的 shadcn-vue 官方 registry 源码拥有：`ui/button`、`ui/badge`、`ui/dialog`、`ui/sheet`、`ui/input`、`ui/table`、`ui/card`。用户列表、概览、设置页直接组合这些组件；业务状态适配保留在 `components/StatusBadge.vue`，弹窗/导航抽屉的中文文案与焦点恢复保留在 `components/AppDialog.vue`。搜索改用官方 Input 后，清除操作通过组件根 input 恢复焦点，中文合成及查询防抖保持原契约。表格的横向滚动与键盘焦点由官方 Table 的 container 承担，不嵌套第二个滚动容器。

用户列表及详情增加最近访问 IP、最近访问时间，复用 AdminTable 和 data.ts 格式化；IPv6 完整值在详情可见，历史空值显示“—”，时间为 Asia/Shanghai。只记录成功登录或通过 Bearer 认证的请求，同一 IP 最多每分钟更新一次，IP 变化立即更新；仅覆盖最近一条，不新增浏览历史，不从旧日志回填。此项由用户明确要求，数据仍只通过管理查询返回，不放入会话、小程序业务响应、URL 或客户端持久化。代理 IP 只信任显式 TRUSTED_PROXY_CIDRS 对应的直连来源，并读取 Nginx 覆盖后的 X-Real-IP。

用户明确要求独立、可部署的 Vue 项目，后台源码位于仓库根 `admin/`。Vue + Vite 构建输出标准 `dist`（index.html、assets/JS、assets/CSS），使用独立 Nginx Docker 镜像部署；后端 3002 端口只提供 /overview 和 /data，不再提供 HTML 页面。前端默认相对资源路径和 `./api/` 接口，支持根目录与 /admin/ 子目录部署；开发/preview 使用 Vite 代理，生产通过可信的前端 Nginx 内网代理。部署开关和接口只读范围沿用既有约定；Docker 宿主发布端口默认 127.0.0.1:8080，公网入口的 Nginx 认证配置见 deploy/vue-admin.md。未新增应用层管理员登录或用户数据写入能力。

视觉依据 DESIGN.md「蓝墨时间簿」桌面适配，首页按服务配置、通知排查、数据指标与全宽订阅速览组织。接口地址通过部署配置指定，连接状态页只展示地址与「检查连接」，没有本地文件访问或运行时远程地址输入。主题偏好可存 localStorage，不持久化业务记录。

所有查询由 `admin/src/lib/useAdmin.ts` 和 `lib/data.ts` 拥有；服务端每页固定 20 条，搜索 300ms 防抖，显式提交立即查询，中文合成期间不提交，清除立即查询并恢复输入焦点。请求超时为 20 秒；AbortController 和请求序号阻止旧请求覆盖新页面。切换搜索/页面清除不对应的旧记录，同页刷新失败保留并标记已读数据；概览与列表错误独立呈现。查询后自动收敛超出范围的页码。

视图、搜索与页码写入 URL，支持 Back/刷新，内存记住各列表搜索和页码。导航更新文档标题 `{页面} · 续订清单管理后台`，焦点放到标题；详情与窄屏导航使用 Reka Dialog，支持焦点锁定、Escape 与焦点恢复。table 语义化，由表格区域承担水平滚动，文档承担纵向滚动；不提供未经 API 支持的排序、状态过滤、批量选择或写操作。点击所属用户进入用户列表并按该用户 ID 搜索。详情只展示接口已经返回的字段，无私密接口读取。403 显示访问权限/代理说明；网络、无效响应和 5xx 提供重试，导航仍可用。

概览未删除订阅数与列表含删除记录明确区分；订单金额已由服务端从分转换为元，UI 不再次换算。paid 配合 simulation 渠道显示「模拟成功」，时间统一 Asia/Shanghai。加载/空态/无结果/错误复用 AsyncState，概览失败显示破折号而非虚构零值，刷新失败保留读取时间。

### 共享与桌面后台 Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Navigation | admin/src/App.vue + useAdmin.ts | URL 视图与 DESIGN.md | 侧栏、窄屏 Dialog | browser E2E、Back |
| Form | App.vue search form | 搜索与分页接口契约 | 防抖、显式查询、清除 | 中文输入/无结果/焦点 E2E |
| Scrollbar | admin/src/style.css | DESIGN.md | 文档纵向、表格横向 | 窄屏 E2E |
| Toast | App.vue status live region + AsyncState | useAdmin.ts | 成功状态、持久错误 | 错误恢复 E2E |
| CRUD | useAdmin.ts + 原有 /data /overview | admin-read.ts | 只读分页/搜索/刷新 | 后端与浏览器测试 |
| Dialog | components/AppDialog.vue + ui/dialog + ui/sheet | shadcn-vue / Reka UI | 记录详情、导航抽屉 | Escape、焦点 E2E |
| Async state | components/AsyncState.vue | useAdmin.ts | 首次、刷新、无记录/无匹配 | 失败/竞争 E2E |
| Select/Listbox | 移动端 uni-app picker | SubscriptionFormView.vue | 平台选择器，桌面无此能力 | 既有 H5 打开与取消 |
| Date | 移动端 uni-app picker | SubscriptionFormView.vue | 日期/时间，桌面仅格式化显示 | 既有小程序编译 |

桌面后台不包含 Select/Listbox、日期输入、写表单和批量选择，平台 picker 的既有所有权继续适用于移动应用。
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

历史支出第一版由 `SpendingHistoryView.vue` + `spending-history.js` 和受认证保护的 `GET /dashboard/history?month=YYYY-MM&currency=CNY&page=1` 拥有。默认本月，按已确认续费记录的 `previousNextBillingDate` 归属月份；使用续费时保存的 amount/currency，排除演示数据，不根据当前价格或周期倒推历史。按原币种分别汇总，分类使用当前订阅分类。无记录和金额未知分别提示，不将未知金额当作零；零元记录计入已确认笔数。

暂停、取消、归档、软删除不移除历史；撤销续费移除相应记录。彻底删除订阅沿用现有级联删除记录的行为，本版不修改数据生命周期。软删除明细保留金额并注明回收站状态，详情入口禁用，需先从回收站恢复。未删除明细可进入订阅详情，返回保留统计模式、月份和币种。历史和估算的加载、空态、错误相互独立，估算汇率失败不影响历史查看。历史明细每页20条，显式加载更多，失败保留已加载明细并重试原页；月份/币种变化清除不匹配旧数据，请求序号与账号校验阻止迟到响应覆盖当前结果。下拉刷新或订阅变化触发历史重读。

新增/编辑的保存栏由各页面入口的根层持有，与 scroll-view 为兄弟节点，固定在屏幕底部并保留安全区；表单内容继续预留底部空间，保存栏不得嵌入滚动容器。

微信新增/编辑使用独立的 pages/subscription/editor 原生入口，仅加载表单、保存后详情及错误状态；首页、统计、会员与个人设置不进入该入口的组件声明。两入口复用 SubscriptionFormView、SubscriptionSaveBar、同一导航桥和业务方法；保存栏始终在各入口 scroll-view 外，网页仍使用 index 内的表单分支。

用户选择保留蓝紫渐变风格，editor 使用自绘导航栏（navigationStyle=custom），由 shell 中的共享 PageHeader 提供唯一的标题与返回按钮。状态栏和导航栏共用原有 page-atmosphere 渐变；表单/详情使用 showHeader=false，不重复绘制顶部栏。首次只挂载轻量顶部，在原生 onReady 后挂载内容，不加固定计时器或首屏占位卡片。顶部与底部保存栏均位于滚动容器之外；返回继续使用未保存确认和原生页面栈。已就绪的微信页面可预加载下一个 WebView；接口不存在、不支持或抛错均不阻塞导航。自绘顶部仍需完成页面初始化，不承诺与原生栏相同的首帧时机。

「我的」移除单独的动态效果开关和重新加载按钮；隐私说明从「关于续订清单」进入，沿既有返回栈导航。H5 动态效果跟随系统 prefers-reduced-motion 并监听变更；主标签页支持下拉刷新，失败仍通过 AsyncState 提供重试，表单和详情页不触发下拉刷新。

首页「待处理事项」仅汇总逾期未确认、稍后处理两类订阅；无待办时隐藏整个区域，不将通知授权、历史空金额或「状态良好」算作待办。通知授权继续由「我的」提供。点击待办先清除搜索及分类筛选，再打开对应状态列表。

首页统一使用底部导航的「＋」新增订阅，不在内容区域重复提供新增按钮；未来 30 天无扣费时，空状态提示「点击底部“＋”添加订阅」。

空状态嵌入已有卡片时使用 EmptyStateView 的 embedded 变体，由外层卡片拥有背景、边框和圆角，内层不重复绘制边框或外边距。

API 分页拉取完整数据供统计；列表仅分批渲染，加载更多属于本地显示操作。

导出由 subscription-export.js 统一生成真正的 .xlsx 文件，免费版与会员均可用，包含所有未删除订阅，不受列表显示批次或筛选影响，不包含回收站。确认弹窗说明数量及金额/备注范围。字段为服务名称、套餐、分类、金额、币种、计费周期、下次扣费日、状态、付款渠道、备注。金额使用数字单元格并显示两位小数；币种独立，未知金额留空，文字使用显式文本单元格，保留中文、换行和前导零，禁止将用户内容当成公式。表头冻结并支持筛选。生成均在客户端，不上传第三方。

H5 下载「续订清单-日期.xlsx」；微信生成一个可覆盖复用的本地「续订清单.xlsx」，使用 openDocument(showMenu=true) 预览并通过菜单发送/保存。预览失败可由用户确认打开微信文件发送界面，不自动选择收件人；取消分享不报错。文件写入或分享真实失败可重新导出，接口不可用时如实提示。导出确认和处理期间禁用重复点击，结束或取消后恢复入口。导出不再复制剪贴板，也不更改订阅数据。
搜索、分类、状态在父页内保持；切换标签后仍保留。单路由小程序不将这些状态写 URL。
新增、编辑和详情沿现有返回栈操作。接口错误不清空表单；离开修改过的表单须确认。

微信小程序内部页面通过 native-navigation.js 将原有视图栈接到 uni.navigateTo / navigateBack；各原生页复用同一 shell 与账户数据，返回时只恢复导航和表单上下文。主页标签仍属于根页，内部页侧滑返回上层；根页的系统退出行为遵循微信。保存编辑后返回原详情，新增成功在当前页显示详情，删除及切换标签折叠到根页。原生页退出后完成的保存不得重新打开详情。微信可用的返回询问接口与自绘返回确认继续使用；系统侧滑无法保证弹确认，未保存草稿保留在内存中，再次进入同账号同条记录可恢复，显式放弃、保存及账号切换会清除草稿。H5 继续使用既有视图栈。
金额隐藏继承服务端设置；额度、会员状态、订阅状态和月均支出字段以后端返回值为准。

2026-10-25：新增与编辑订阅时金额必填，0 表示免费。SubscriptionFormView 显示「必填，免费填 0」；subscription-page-logic.validateForm 阻止空值提交并提示「请输入订阅金额」。后端创建要求非负、最多两位小数的金额；PATCH 可省略金额以保留原值，但不可将其清空。历史空金额保留读取兼容，编辑保存时必须补齐。

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

## 个人主体虚拟支付（2026-10-14）

用户要求接入个人主体小程序虚拟支付，永久方案售价 ¥9.90，不增加自动续费。会员页由 MembershipView.vue 拥有；创建、继续支付、刷新与跨账号防护由 membership-remote.js 拥有；真实收银台由微信平台拥有。服务端按账户锁定订单和权益，AppID、付款账号、道具、环境、金额与平台交易号须核对；仅验签回调或服务端查单可确认 paid 并授予权益。客户端成功、取消和失败均不修改服务端付款状态。真实支付开启时禁止模拟开通/撤销；真实退款尚无页面入口。

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Membership payment | MembershipView.vue + membership-remote.js | MembershipPaymentsService + WechatPayService | 模拟、个人主体虚拟支付、未开放 | 下单、取消、待确认、恢复、重复提交、账号切换 |

购买与继续支付显示真实金额，忙碌期间锁定按钮；取消、失败或网络中断保留订单并提示刷新，不自动重复支付。刷新先查订单，再读会员权益；结果未确认不展示开通成功。正式支付仅在微信小程序中调用，不在 H5 发起支付。配置与部署依据见 deploy/个人主体虚拟支付.md。

用户要求先隐藏会员入口（2026-10-14）：`subscription/config/features.js` 的 MEMBERSHIP_ENTRY_ENABLED 默认 false，统一控制“我的”会员卡片、会员页渲染与 openMembership 导航。额度用完只提示删除记录释放名额，不跳转会员中心。已有会员权益和后端支付实现保留；后台继续只读查询会员权益及订单。

虚拟支付道具为 lifetime_member，售价 ¥9.90；调用支付前重新微信登录以取得有效用户态签名。发货推送与服务端查单才可开通权益，客户端成功回调不可直接开通。未开通 Apple IAP 时禁止 iOS 发起购买；2026-10-15 用户要求本地测试，会员入口已开启；支付是否可用仍由后端配置决定。

2026-10-15 本地测试：MEMBERSHIP_ENTRY_ENABLED 改为 true，显示“我的”会员卡片并允许会员页导航；本次仅开启入口，不改变支付环境或服务端收款开关。


## 2026-10-16 时间簿视觉重构

本轮仅调整界面结构、导航适配与视觉语言，数据请求、权限、额度、会员价格、支付开关与续费状态机继续由原业务来源拥有。首页顶部新增入口替代页尾按钮；微信提醒开启入口合并入既有待处理事项，保留 handle-reminder → notification 原调用链。个人列表把价格独立为右列，名称、状态、周期、付款方式与日期保留；完整名称在详情读取。

H5 760px 起五个导航项以侧栏呈现，移动端继续底部导航。表单与详情仍沿原返回栈，保存后进入详情；表单选项、日期和时间继续接受 uni-app 平台弹层，不新增私有选择器。管理端只读能力和 URL 搜索分页契约不变，ServiceStatus 在首页运行摘要与连接页复用。

验证入口：subscription/tests/ui.e2e.cjs 使用真实构建、内存 Nest API 与 Edge；所有测试会话和写入均限于本机内存，远程请求拦截，个人端源码没有演示数据或测试登录分支。历史规则「保留绿色」与固定 480px H5 容器由本轮用户授权的全局视觉重构取代；原生 picker、Dialog/Sheet、查询及 CRUD 所有权保留。


## 剩余页面的外观与可访问适配

共享外观归 `styles/_surfaces.scss`，摘要由 `.soft-summary`、内容面板由 `.soft-panel` 及已有业务选择器拥有。日历布局为移动上下、桌面双栏；月导航/日期/当天项目的操作仍由 SubscriptionCalendarView emits → 原页面方法拥有。统计周期和币种仍由 StatSummaryCard 及既有远程统计拥有，图中文字与选择周期保持一致。SettingsRow 在 action 变体提供 role、tabindex 和可访问名称，保留独立 activate 业务事件，平台 picker 仍是单选拥有者。会员按钮的 aria-disabled 直接镜像原 disabled 条件，不改购买、支付或退款判断。所有表单、草稿返回、写入确认和支付来源继续遵循原契约。

## 会员中心信息流（2026-10-20）

依据用户本次重设计要求及 subscription/docs/会员功能设计.md 的现有权益规则，会员页改为活跃的会员俱乐部外观。身份、权益和永久方案优先展示；普通历史订单通过「我的订单」按钮展开，本次待处理/已选择订单保持原有同页收银台。FAQ 使用本地 disclosure 状态，不触发请求。订单刷新继续由 membership-remote.js 拥有，加载、错误和支付回执仍复用 AsyncStateView 与原状态区域。

会员页不展示商户服务费、结算周期和商户总额限制。模拟模式继续标注不扣款与测试权益；真实购买、重复提交保护、iOS 限制、撤销确认与金额来源保持既有契约。会员保障与基础功能说明不可描述为新增独占能力。视觉 token 所有权及用户明确的风格覆盖见 DESIGN.md「会员中心：活跃会员俱乐部」。


## 管理员会话与支付核对

管理员会话由admin/src/lib/useAdminSession.ts管理；AdminLogin.vue复用Input/Button，字段由登录表单拥有校验，保留autocomplete=username/current-password。401统一清空业务数据、关闭详情并回到登录。登录口令不进入浏览器持久存储；退出服务器撤销失败时保留会话并提示重试。支付/权益页只读，复用useAdmin与AdminTable，口径以backend/src/subscriptions/repositories/billing-audit.ts及部署说明为准。金额仅CNY真实已支付，不显示虚构趋势或结算额。
统计页在管理员会话内访问；7／30／90 天范围持久在 URL，切换取消过期请求，失败可重试，同范围刷新失败标记旧数据；401 清除会话回到登录。每日明细可替代图表阅读，图表可用方向键浏览。未知历史与未成熟留存不得用零替代，生产采集与本地只读开发相互区分。
2026-10-25：用户已要求后台办理退款，覆盖旧的全站只读约定。退款复用订单详情与共享表单／按钮，通过「核对并退款→确认退款 金额」两步提交；后端决定金额与操作人，持久化原退款单号防重复。失败可查询原单，不自动重发；平台受理不表示完成。原生 select 负责本次少量退款原因类别，无自建弹层选择器。今日摘要由 TodaySummary 统一负责，北京时间日期可见；全站移除与管理员任务无关的连接和运行配置标签。
收支与分类：支付历史在退款后保留，退款按独立成功凭据及平台日期记录，未知日期不补造，净额可负。统计弹窗由 StatsDetailDialog 拥有，复用共享 Table／Input／Button／AppDialog；指标、日期、当前账号范围贯穿搜索和分页，合计对全部筛选结果计算。UserTestFlag 拥有分类表单，管理员确认原因后保存；本地只开放分类元数据的专用写事务，业务连接默认只读，实际退款保持关闭。切换统计范围时清除旧范围数据，401 关闭明细并清空记录。

## 多币种汇总（2026-10-26）
首页、日历和统计默认按设置中的全局币种换算后汇总，订阅详情及导出保留原币种。统计币种选择只临时改变统计展示，不改全局设置；全局币种变更后统计同步。换算结果标记为估算。汇率不可用时显示待换算或错误，并沿用统计重试入口，不漏算、不以零替代外币金额。共享计算由 SubscriptionsService 与页面 convertedTotal 拥有，参考汇率快照由 ExchangeRatesService 提供。
