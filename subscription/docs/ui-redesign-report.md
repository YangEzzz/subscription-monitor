# 续订清单 UI 改造交付报告

日期：2026-10-20。范围：小程序个人端全部业务视图；管理后台不在本次范围内。

技术栈为 uni-app、Vue 3 Options API、SCSS。保留用户确认的单路由结构：`pages/subscription/index` 注册在 `pages.json`，由 `activeView` 切换首页、订阅、日历、统计、我的、会员、详情、表单和提醒设置。全局样式入口是 `App.vue` → `styles/subscription.scss`。

## 1. 完成范围

- 设计令牌由原始 `tokens.css` 自动生成，设计 px 按 750/390 转 rpx，1px 细线保留。
- 统一头部、卡片、订阅行、设置行、Logo、按钮、胶囊、搜索、分类、状态 Tabs、分段控件、空/错/加载状态。
- 底栏统一为首页、订阅、中间新增、日历、我的；统计从首页进入，统计和会员中心均有返回且不显示底栏。
- 六个主要页面完成视觉改造；新增、编辑、详情、提醒设置和排序弹层也纳入统一样式。
- 首页时间轴、日历续费标记、统计环图和柱图均来自现有数据；没有写入原型里的日期或金额。
- 日历空状态新增沿用现有 `openForm(selectedDate)`，支持预填所选日期。
- 「我的」增加内存级「减少动态效果」开关；不新增存储、接口或业务字段。

新增/编辑和详情页在最终复核中进一步修正了旧样式残留：背景按真实状态栏高度与全局渐变衔接，卡片、模板、字段、金额、提醒节点及操作区使用新令牌，消除旧蓝灰材质和旧描边覆盖。

红框问题复核：统计/隐藏金额、全部入口及日历工具组已将可见外观与44px点击热区分开；「全部」重置默认按钮外边距后靠右；金额与币种合并成一个输入容器；提醒节点改为34px可见高度、44px点击高度的三列网格；提前续费按钮清除旧纵向布局和继承行高，改为44px横排，倒计时标题降为16号。均仅调整展示结构和样式。

按用户后续反馈，表单模板、单行输入、金额组合及文本域改为白底细描边，不再使用灰色填充。单行输入清除上下内边距并设置与44px高度一致的行高，修正占位文字偏上；左右对齐方式和所有字段行为保持原样。此项白底替代原凹陷底色属于用户明确指定的视觉调整。

## 2. 修改与新增文件

以下路径相对仓库根目录。编译产物不作为手写源码维护。

| 文件 | 说明 |
|---|---|
| `DESIGN.md` | 记录本次规范、令牌所有权和已确认的单路由方案。 |
| `UX-CONTRACT.md` | 记录公共展示组件与现有业务事件契约。 |
| `subscription/App.vue` | 引入全局生成令牌。 |
| `subscription/scripts/sync-ui-tokens.mjs`（新增） | 从设计源生成 rpx 令牌及 Canvas 色板，支持漂移检查。 |
| `subscription/styles/_design-tokens.scss`（新增） | 生成的全局设计变量。 |
| `subscription/styles/ui-palette.js`（新增） | Canvas 使用的同源色板。 |
| `subscription/styles/_tokens.scss` | 历史 Sass 名称映射到新 CSS 变量。 |
| `subscription/styles/_ui.scss`（新增） | 公共组件、语义颜色、字体、反馈、骨架与减少动态规则。 |
| `subscription/styles/_dock.scss`（新增） | SVG 凹槽、选中底块、凸起新增及动效。 |
| `subscription/styles/_pages.scss`（新增） | 主页面布局、背景、时间轴、日历和图表样式。 |
| `subscription/styles/_membership.scss`（新增） | 会员已开通、未开通及订单区样式。 |
| `subscription/styles/_ancillary.scss`（新增） | 详情、新增/编辑、提醒设置和排序弹层的统一视觉。 |
| `subscription/styles/_ledger.scss` | 减少动态时保留颜色与透明度反馈。 |
| `subscription/styles/subscription.scss` | 接入新公共及页面样式，保留仍被使用的历史基础布局。 |
| `subscription/components/subscription/PageHeader.vue`（新增） | 一级/二级头部，按真实微信胶囊尺寸避让。 |
| `subscription/components/subscription/UiSelection.vue`（新增） | 分类 Chip、下划线 Tabs 和分段滑块，保留原选择事件。 |
| `subscription/components/subscription/UiSkeleton.vue`（新增） | 列表、总览、日历和图表骨架。 |
| `subscription/components/subscription/DisplayAmount.vue`（新增） | 拆分既有格式化金额的字体层级并提供更新过渡。 |
| `subscription/components/subscription/DonutChart.vue`（新增） | 使用真实分类值绘制圆角分段 Canvas 环图。 |
| `subscription/components/subscription/SettingsRow.vue` | 统一设置行、值、图标底块和反馈。 |
| `subscription/components/subscription/brand-logo.vue` | 统一服务标识的尺寸与材质，沿用原 Logo 和品牌色。 |
| `subscription/components/subscription/subscription-row.vue` | 统一订阅行、完整日期、状态、倒计时和缺失金额提示。 |
| `subscription/components/subscription/EmptyStateView.vue` | 虚线图标块与次级操作。 |
| `subscription/components/subscription/AsyncStateView.vue` | 卡片内错误与重试展示。 |
| `subscription/components/subscription/StatSummaryCard.vue` | 金额、币种选择与统计口径公共总览。 |
| `subscription/components/subscription/SubscriptionHomeView.vue` | 总览、真实时间轴、续费分组和原待处理事项。 |
| `subscription/components/subscription/SubscriptionListView.vue` | 搜索、筛选、排序、订阅行和次级新增入口。 |
| `subscription/components/subscription/SubscriptionCalendarView.vue` | 真实续费标记、日期选择、当日明细与新增预填入口。 |
| `subscription/components/subscription/SubscriptionStatsView.vue` | 二级头部、分类环图、图例和按真实值归一的柱图。 |
| `subscription/components/subscription/SubscriptionProfileView.vue` | 账户、会员条、全部原设置项和减少动态开关。 |
| `subscription/components/subscription/MembershipView.vue` | 会员双状态和原订单、支付、FAQ 等内容的新视觉。 |
| `subscription/components/subscription/SubscriptionDetailView.vue` | 服务总览、金额、属性、提醒、记录和处理操作的新布局。 |
| `subscription/components/subscription/SubscriptionFormView.vue` | 新增/编辑的引导、模板、字段和保存操作统一视觉。 |
| `subscription/components/subscription/ReminderSettingsView.vue` | 提醒规则页统一头部与设置样式。 |
| `subscription/components/subscription/SubscriptionSortSheet.vue` | 排序弹层与选中态样式。 |
| `subscription/components/subscription/SubscriptionTabBar.vue` | 四入口加中间新增的 Vue 底栏及切换动效。 |
| `subscription/pages/subscription/index.vue` | 接线展示组件、统计导航、骨架和内存级减少动态状态。 |
| `subscription/pages/subscription/subscription-page-logic.js` | 仅调整 `showTabBar`，使统计不再显示底栏。 |
| `subscription/tests/component-events.test.mjs` | 补充选择事件和胶囊避让的契约验证。 |
| `subscription/tests/ui.e2e.cjs` | 按新入口回归原有操作流程并输出截图。 |
| `subscription/tests/ui-compact.e2e.cjs`（新增） | 对辅助控件尺寸、右对齐、320/390表单布局及提前续费横排做隔离回归。 |
| `subscription/docs/ui-redesign-report.md`（新增） | 本报告。 |
| `subscription/docs/ui-redesign/`（新增） | 保存截图和验证记录。 |

工作区原本已有 `backend/src/auth/wechat-session.ts`、`subscription/docs/ui-verification.md` 等改动，本次没有覆盖或纳入 UI 改造。`unpackage/` 中的变化包含开发环境自动编译结果，不代表新增了对应业务源代码修改。没有删除文件，没有修改 API、远程业务模块、支付流程、通知授权或公共业务工具。

## 3. 规范字段 → 代码字段

### 首页

| 规范字段/区块 | 现有字段或事件 |
|---|---|
| 页面标题、副标题 | 保留现有静态文案。 |
| 未来30天金额 | `next30TotalText`，仍由原逻辑分别汇总币种。 |
| 共N项、月均约 | `next30Subscriptions.length`、`monthlyAverageText`。 |
| 统计、隐藏金额 | `open-stats` → `navigateToView('stats')`；`settings.amountVisible` → `toggleAmount`。 |
| 时间轴位置、Logo | `next30Subscriptions`、`decorateItem(item).days`、`item.logo/color`。 |
| 正在订阅、7天内提醒 | `activeSubscriptions.length`、`upcoming7.length`。 |
| 全部数量、续费分组 | `activeSubscriptions.length`、`upcoming7`、`upcoming30Later`。 |
| 订阅行 | 原 `decorateItem` 输出及 `openDetail`。 |
| 待处理数量/列表/操作 | `actionableReminders`、`handleReminder`，保留原内容。 |

### 订阅

| 规范字段/区块 | 现有字段或事件 |
|---|---|
| 搜索、新增 | `searchKeyword`/`searchDraft`、`search`/`clear-search`、`openForm`。 |
| 分类名称/数量 | `categoryFilters`、`activeCategory`。 |
| 状态 Tabs | `statusFilters`、`activeStatus`，保留完整原标签。 |
| 排序及当前口径 | `sortLabel`、`activeStatusLabel`、`sortMode`、`chooseSort`。 |
| 筛选数量 | `visibleSubscriptions.length`。 |
| 服务、状态、周期、支付 | `name`、`getStatus/statusText`、`cycleText`、`payment`。 |
| 完整日期、金额、倒计时 | `nextBillingDate`、`amount/currency`、`formatDate/formatMoney/daysText/decorateItem`。 |
| 分页 | 沿用现有 `displayLimit` 每次20项。 |

### 日历

| 规范字段/区块 | 现有字段或事件 |
|---|---|
| 月份和切换 | `calendarTitle/calendarCursor`、`changeMonth/goToday`。 |
| 日期格、数量、金额 | `calendarDays` 的 `key/day/currentMonth/count/amountText`。 |
| 今天、选中日期 | `todayKey` 来自当前系统日期；`selectedDate/selectDate`。 |
| 续费标记 | 传入原 `activeSubscriptions`，按日期匹配，仅增加显示标记。 |
| 明细日期、星期、数量/金额 | `selectedDateTitle/selectedWeekday`、`selectedDateSubscriptions.length/selectedDateTotalText`。 |
| 明细列表与新增 | `selectedDateSubscriptions`、`openDetail`、`openForm(selectedDate)`。 |

### 统计

| 规范字段/区块 | 现有字段或事件 |
|---|---|
| 返回 | `back` → `goBackView('home')`。 |
| 总览标题、金额 | `statsLabel`、`statsTotal`、`formatMoney`。 |
| 币种、有效订阅数 | `statsCurrency/currencies/changeStatsCurrency`、`statsSubscriptionCount`。 |
| 月均/年度/未来30天 | `statPeriods/statsPeriod`，原口径计算不变。 |
| 分类及比例 | `categoryStats.name/value/percent`；Canvas 弧长按原数值生成。 |
| 分类颜色 | 固定设计分类色，其余按现有 `categories` 的稳定顺序映射。 |
| 六个月柱图 | `trendData.month/value`；新增展示用 `plotHeight = value / max`。 |
| 缺失金额/不换汇说明 | 保留原说明与原统计排除逻辑。 |

### 我的

| 规范字段/区块 | 现有字段或事件 |
|---|---|
| 头像、用户名、已登录 | 沿用「续」「续订清单用户」和原 `dataReady` 登录展示，不编造微信昵称。 |
| 已保存、月均、提醒状态 | `liveSubscriptions.length`、`monthlyAverageText`、`notificationReady`。 |
| 会员入口/额度 | `membershipEntryEnabled/isMember/freeQuotaText/membershipQuotaPercent`。 |
| 续费通知、暂停通知 | `notificationDescription`、`settings.notificationEnabled` 和原授权/暂停处理函数。 |
| 通知记录 | 原 `notifications.recentDeliveries` 及展示入口。 |
| 默认提醒 | `settings.defaultReminders/reminderTime` 与原提醒设置入口。 |
| 默认币种 | `settings.defaultCurrency/currencies` 与原选择事件。 |
| 其他数据与偏好 | 原导出、回收站、隐私、刷新入口完整保留。 |
| 减少动态效果 | 新增纯展示 `reducedMotion`，仅当前应用实例内有效。 |

### 会员中心

| 规范字段/区块 | 现有字段或事件 |
|---|---|
| 开通状态、永久权益 | 原 `isMember/membership`；`loading/error` 时不假定已开通。 |
| 会员卡、权益说明 | 使用规范允许的文案，保留原免费额度、测试权益说明。 |
| 价格 | `membership.product.amount` 经原 `price()` 格式化，单位仍为分；不写死9.90。 |
| 开通按钮及可用性 | 原 `available/channel/iosEnabled` 和 `busy/loading/error` 守卫。 |
| 购买/订单/刷新/退款/模拟 | 保留原 `purchase/pay/simulate/refund/refresh/select-order` 等事件。 |
| 订单展开、FAQ | 原 `orders/order/showOrders/questions/openQuestion`。 |

### 详情、新增/编辑、提醒设置

| 页面/区块 | 原字段或事件 |
|---|---|
| 详情服务/金额/日期/状态 | `subscription`、`formatMoney/formatDate/cycleText/daysText/getStatus/statusText`。 |
| 详情提醒/记录/试用/备注 | `reminders/selectedNextReminderText/renewalHistory/trialEndDate/note/cancelGuide`。 |
| 详情操作 | `renewalLocked` 与原 `confirm-renewal/undo-renewal/snooze/cancel/manage/edit/back`。 |
| 新增/编辑基本信息 | `editingId`、`form.name/plan/category/logo/color`。 |
| 扣费信息 | `form.amount/currency/cycle/cycleValue/payment/nextBillingDate/autoRenew`。 |
| 试用、提醒及补充 | `form.trial/trialEndDate/reminders/note/cancelGuide`、`formReminderPreview`。 |
| 模板和选项 | 原 `serviceTemplates/categories/currencies/cycles/payments/logoColors/reminderOptions`。 |
| 表单校验和保存 | 原 `formError/busy`、`save` 与其他字段更新事件；验证和持久化不变。 |
| 提醒设置 | 原 `defaultReminders/reminderTime/timezone` 及对应事件。 |
| 排序弹层 | 原 `sortOptions/sortMode` 与选择/关闭事件。 |

规范中的演示数字、日期、金额均非新字段。未找到需要补造业务数据的字段。现有代码没有原生多页 TabBar，因此规范中的 `app.json tabBar` 迁移不适用，详见下一节。

## 4. 与规范的差异及原因

1. **保留单路由 Vue 底栏。** 用户已确认保留当前结构，未新增原生 `custom-tab-bar`、未拆分路由。统计使用原视图导航；共享底栏实例保持选中滑块连续，效果不依赖跨原生页全局缓存。
2. **业务数据优先。** 多币种分别显示、不自动换汇；金额缺失仍提示待补充。状态完整名称、待处理事项、数据与偏好条目、订单及支付说明均沿用原实现。
3. **会员购买文案由真实通道决定。** 未开放、模拟、虚拟支付和 iOS 限制继续受原配置控制，不强制套用静态「9.90开通」按钮。
4. **减少动态仅保存在内存。** 重建应用后恢复默认；避免改变用户存储结构。H5 同时响应系统 `prefers-reduced-motion`。
5. **金额更新使用整个格式化数值的淡入上移。** 没有逐位数字滚轮或插值计算，不产生与原业务不一致的中间金额。
6. **动效保留规范自身的例外时长。** 主滑块位移480ms、颜色260ms；骨架1.2秒、光环2.8秒，以及规范中新增按钮弹跳/波纹等独立节奏单独实现。减少动态会关闭位移与循环。
7. **平台原生交互保留。** 日期/币种 Picker、业务确认弹窗、微信授权与收银台沿用平台行为。没有使用 Web Animations、`clip-path:path()` 或 `backdrop-filter`。
8. **无独立效果图的辅助页。** 详情、新增/编辑、提醒设置从公共组件规范推导视觉，完整保留字段和操作；没有新增业务模块或演示信息。

## 5. 检查与回归

| 项目 | 结果/证据 |
|---|---|
| 单元及事件契约 | 43/43通过，涵盖 API、登录、通知、会员与组件事件。 |
| HTTP 集成 | 4/4通过，隔离内存服务验证 API、会员、虚拟支付和访问隔离。 |
| H5业务交互 | 搜索、分类、状态、排序、详情、表单校验/保存/编辑、续费处理、回收站、错误重试等原流程通过。 |
| 补充交互 | 币种、月均/年度/未来30天、日期预填、默认币种、减少动态和键盘筛选通过。 |
| 红框尺寸回归 | 紧凑外观、44px点击热区、首页靠右、三列提醒Chip、无横向溢出、详情横排按钮高度检查通过。 |
| 会员展示 | 未开通/已开通、慢加载、失败恢复、通道未开放、模拟/虚拟通道及 iOS 提示通过；测试未触发真实扣款。 |
| 适配 | H5在320、390及桌面宽度检查溢出；微信模拟器逻辑尺寸390×844。 |
| 构建 | H5和mp-weixin构建成功；保留编译器原有第三方/uniCloud提示。 |
| 令牌漂移 | `node subscription/scripts/sync-ui-tokens.mjs --check` 通过。 |
| 颜色与数字 | 新展示组件颜色引用令牌；服务品牌色来自现有记录；金额、日期、计数用数字字体及等宽数字。 |
| 每屏层级 | 每页一个主要操作与一张总览hero；其他操作为浅底或描边。 |
| 标签 | 统一浅底与同色描边，状态同时有文字说明。 |
| 底栏/安全区 | 四个一级视图显示，其他视图隐藏；包含安全区、底部渐隐和滚动留白。 |
| 按压/减少动态 | 原按钮及新控件有反馈；开关禁用光环、滑动、位移和循环。 |

验证命令及原始记录保存在 [verification](ui-redesign/verification/)；主自动化脚本是 `subscription/tests/ui.e2e.cjs`。截图期间微信模拟器只调用已有页面导航/读取方法，没有保存记录、购买或修改通知授权；H5交互回归使用隔离测试数据。

静态审计工具报告52条 `affordance.actionless-button`（小程序47条，未改动后台5条），因此不能称该严格审计零告警。逐个解析小程序 Vue 模板后，47个按钮均绑定 `@tap`，未发现缺失事件；该检测器未识别 uni-app 点击语法。设计文档 lint 为0错误、7条历史令牌提示。原始报告与按钮核对结果均已保存。

## 6. 截图

微信开发者工具的设备逻辑尺寸为 **390×844（iPhone 14）**。工具导出的原图为540×1166，包含模拟器设备外框，未人为拉伸或重画。

| 页面 | 微信模拟器截图 |
|---|---|
| 首页 | [首页](ui-redesign/screenshots/wechat-home.png) |
| 订阅 | [订阅列表](ui-redesign/screenshots/wechat-subscriptions.png) |
| 日历空状态 | [日历](ui-redesign/screenshots/wechat-calendar.png) |
| 日历选中有续费 | [当日明细](ui-redesign/screenshots/wechat-calendar-selected.png) |
| 我的 | [我的](ui-redesign/screenshots/wechat-profile.png) |
| 统计 | [统计](ui-redesign/screenshots/wechat-stats.png) |
| 会员中心 | [已开通](ui-redesign/screenshots/wechat-member.png) |
| 详情 | [订阅详情](ui-redesign/screenshots/wechat-detail.png) |
| 新增 | [新增订阅](ui-redesign/screenshots/wechat-form.png) |
| 编辑 | [编辑订阅](ui-redesign/screenshots/wechat-form-edit.png) |
| 默认提醒 | [提醒设置](ui-redesign/screenshots/wechat-reminder-settings.png) |

会员双状态另有隔离 H5 测试截图：[未开通](ui-redesign/screenshots/h5-member-free.png)、[已开通](ui-redesign/screenshots/h5-member-active.png)。它们是测试响应下的展示验证，不冒充真实账户状态。

红框修正后的原生局部截图：[金额与提醒节点](ui-redesign/screenshots/wechat-form-controls.png)、[提前续费操作](ui-redesign/screenshots/wechat-detail-early.png)。首页和日历截图也已更新。窄屏隔离回归截图：[320宽表单](ui-redesign/screenshots/h5-compact-form-320.png)、[390宽表单](ui-redesign/screenshots/h5-compact-form-390.png)。

## 7. 仍需确认与验证边界

没有阻塞本次视觉交付的待确认业务问题。规范第9节全部沿用现有实现。

尚未进行真机支付、真实订阅消息发送及多台 Android/iOS 实机性能测试；本次没有为验证视觉而触发这些外部操作。模拟器截图验证了渲染，完整点击回归主要在 H5 隔离环境执行，不应将两者视为真机全链路验收。
