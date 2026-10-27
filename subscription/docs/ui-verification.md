# UI 重构验证记录

## 2026-10-13 重复点击事件修复

- `SettingsRow` 与 `SubscriptionRow` 的业务事件由 `tap` 改为 `activate`，避免微信小程序原生 tap 冒泡与组件自定义事件同时执行父级处理函数。设置行的 switch 同步改用 `checked-change`，避免相同的 change 冲突。
- 同步更新“我的”全部设置入口及首页订阅行；币种 picker 保留原生 tap 冒泡。排序弹层与首页通知按钮已有 stop 修饰符，无需修改。
- `node --test tests/api.test.mjs tests/auth.test.mjs tests/notifications.test.mjs tests/component-events.test.mjs`：30/30 通过。新增测试模拟组件事件与原生冒泡同时到达父级，验证单次执行、禁用态、switch 布尔值传递，并扫描所有订阅组件的原生事件命名冲突。
- 检查 HBuilderX 自动更新的 `unpackage/dist/dev/mp-weixin`：我的页面 8 个 settings-row、首页 2 个 subscription-row 均绑定 `bindactivate`，没有在这些组件上保留 `bindtap`。
- 未在微信真机执行点击验证；发布需重新发行并上传小程序。

## 2026-09-30 微信登录验证

- 前端登录与接口测试 16/16，通过并发登录合并、过期缓存、401 单次重登、停止重复重登、写请求不重发及失败恢复验证。
- 后端测试 16/16，覆盖微信凭证兑换、稳定用户身份、不同账号、篡改/过期/错误 AppID 令牌和提供方失败。
- 真实 Nest HTTP 集成测试 1/1，覆盖无令牌资源访问拒绝、伪造用户头无效、两账号数据/设置/会员隔离及完整订阅流程；微信返回值由测试模拟。
- 后端 TypeScript 构建与 ESLint 通过。微信 code2Session 联通检查返回预期的无效临时 code 错误 40029，不等于完成真实用户登录。
- strict 静态审计保留 45 项既有 `affordance.actionless-button`，全部是检查器未识别 uni-app `@tap`；Canonical UI Map 未解决项为 0。
- 真实微信登录需部署新后端并在微信开发者工具或真机使用平台生成的 code 验证；本轮未完成真机交互验收。

日期：2026-09-08。目标：中文 uni-app 订阅工具；H5 实际预览与微信小程序编译。

## 已执行

- HBuilderX 5.24 内置 uni-app/Vite 编译器启动真实 H5 应用，连接 localhost:3001 演示后端。
- 390 × 844 窄屏截图检查：首页、列表、统计、编辑表单。日期签、金额、底部导航均正常显示；分类图例改为独立明细区以避免拥挤。
- 搜索不存在的服务出现「没有匹配的订阅」，可重置；详情正常读取。
- 后端不可用时出现「无法连接后端」及重新加载；恢复后端后点击重试成功恢复首页。
- 编辑服务名后返回出现确认；继续编辑保留草稿，放弃后返回原始详情，未向服务端写入测试修改。
- Enter 可切换统计到年度；排序弹层支持初始焦点、Tab 循环、Escape 关闭及焦点恢复。
- `pnpm --dir subscription test`：9 项通过（接口、分页、失败恢复、重复提交保护、统计并发）。
- `pnpm --dir subscription test:integration`：1 项通过，连接独立 Nest HTTP 实例完成业务流程。
- `uni.js build -p mp-weixin`：成功，输出位于忽略目录 subscription/.preview/mp-weixin；保留原有 unpackage 输出。
- 微信端 WXSS 兼容性：H5 专属的 `@media`、通用选择器与滚动条规则已用 `#ifdef H5` 隔离；同步检查 `unpackage/dist/dev/mp-weixin/app.wxss` 不含这些规则。
- `designmd lint DESIGN.md`：0 errors，7 个镜像 token 未被 frontmatter 组件显式引用的 warnings，运行时使用记录于 DESIGN.md。

## 浏览器逐项验收

使用真实 H5 页面 `http://localhost:5173/`，在 390 × 844 移动视口中逐项操作，并补充 320 × 700 与 1024 × 800 布局检查。共 34 项断言，34 项通过：

- 首页：金额隐藏与恢复、站内提醒能力说明、服务端汇总数据。
- 列表：加载、搜索与清空、分类和状态筛选、排序弹层、金额降序、Escape 关闭及焦点恢复。
- 详情与编辑：详情读取、编辑预填、未保存草稿拦截、继续编辑、放弃修改、必填校验。
- 完整写流程：创建测试订阅、多提醒节点保存、确认续订、撤销续订、稍后处理、暂停与恢复、复制、删除、回收站恢复。
- 日历：事件金额、日期明细、前后月份、返回今天、从指定日期进入新增页。
- 统计：月均、年度、未来 30 天口径；CNY/USD 切换与恢复；分类构成及趋势展示。
- 设置：默认提醒保存与恢复、每周摘要开关、默认币种、CSV 导出、隐私说明、手动刷新。
- 会员：模拟开通、无限额度展示、恢复免费版。
- 韧性：后端断开时保留上次数据并显示明确错误，后端恢复后可重新加载；重启内存后端后恢复 9 条初始数据，测试记录已清除。
- 响应式：320px 无横向溢出；1024px 内容壳居中且页面无横向溢出。

验收过程中修复并复验了三个控制台问题：写操作先结束 loading 再显示 toast，消除 `showLoading/hideLoading` 配对警告；H5 picker 等待关闭动画后再触发页面更新，消除空节点 `remove` 异常；会员权益改为合法的 `view + text` 结构，消除 `<text>` 嵌套组件警告。修复后的新浏览器会话只剩 uni-stat 未关联 uniCloud 服务空间的既有配置提示。

最终再次执行 `pnpm --dir subscription test`（9/9）、`pnpm --dir subscription test:integration`（1/1）与 HBuilderX 5.24 `uni.js build -p mp-weixin`，均成功。构建产物 `subscription/.preview/mp-weixin/app.wxss` 未检出 `@media`、通用选择器或 `prefers-reduced-motion` 等微信 WXSS 不支持的 H5 规则。

## 静态审计说明

原始 strict 审计保存在项目根目录 [premium-audit.json](../../premium-audit.json)，未屏蔽规则或改写结果；此前的 docs 副本也保留作运行记录。
46 条均为 `affordance.actionless-button`：检查器仅识别 Web click/submit，未识别 uni-app 的 `@tap`。
逐条读取对应 button 标签验证，46/46 均绑定 `@tap`；实际 H5 点击与小程序编译验证了这些事件的适配路径。
Canonical UI Map 未解决项为 0；textarea 统一通过 resize-none 类和全局样式禁用手动缩放。

## 边界

未连接微信开发者工具或真实手机执行交互；需在 HBuilderX 重新运行到微信小程序查看最终平台效果。
编译提示来自既有 uni_modules 的 uniCloud 及鸿蒙适配警告；H5 既有 uni统计未关联服务空间。
减少动态效果使用全局 prefers-reduced-motion 规则；没有依赖动画完成的业务流程。
预览使用 HBuilderX 已安装的 Sass，通过忽略的 node_modules junction 引用；未添加业务依赖。

## 2026-09-10 异常状态补充验证

- 页面级加载失败和统计失败统一使用 `AsyncStateView`，均提供可重复触发的重新加载入口；加载期间按钮进入 busy 状态。
- 后端错误体统一携带稳定 `code` 和 `requestId`。前端会按鉴权、校验、资源冲突、限流和服务端错误给出中文提示，并在服务端错误中显示请求编号。
- 写操作遇到超时或网络中断时不自动重试，页面提示“操作结果尚未确认”，引导重新加载后继续，避免重复创建或重复续订。
- 统计数据为零时展示明确空状态及“添加第一笔订阅”入口，不再渲染无意义的空图表。
- `pnpm --dir backend build`、`lint`、`test` 通过（11 项）；`pnpm --dir subscription test` 通过（10 项）；真实 Nest HTTP 集成测试通过（1 项），覆盖 422 校验错误、404 错误、错误码和请求编号透传。
- 新增及修改的四个 Vue 单文件组件已通过 `@vue/compiler-sfc` 模板编译与 Sass 编译。
- 使用与组件相同排版和交互契约的隔离预览完成浏览器检查：390 × 844 与 320 × 700 均无横向溢出；两个错误区均具有 `alert` 语义；重试后按钮禁用并显示“正在重试”；空状态入口可触发；键盘 Tab 可到达下一操作按钮并显示焦点环。
- strict 审计报告 45 个 `affordance.actionless-button`，均来自检查器不识别 uni-app `@tap`；本次新增重试按钮已绑定 `@tap`。
- 当前从命令行直接调用 HBuilderX 的 Vite 入口会在既有 `store/index.js` 条件编译块处报重复语法，无法生成本轮微信构建产物；该文件未因本轮异常状态改造而变更。需在 HBuilderX 项目上下文中执行一次微信小程序编译并在开发者工具中确认最终视觉效果。

## 2026-10-14 个人主体虚拟支付接入

会员页沿用原有组件和绿色账簿样式，按服务端商品 channel 区分个人主体虚拟支付、模拟支付及未开放状态。真实支付入口显示 ¥9.90，调用微信收银台；取消和异常保留待支付订单并提示刷新。正式支付开启时历史模拟订单只读，真实订单不提供撤销模拟权益入口。支付签名和开通条件见 deploy/个人主体虚拟支付.md。

- 后端 TypeScript 编译、Prisma 模型校验与客户端生成通过；后端 lint 通过，10 个测试套件 73/73 通过。
- 小程序单元回归 39/39，通过取消支付、并发点击、账号切换与 H5 不创建付款订单等路径。
- 本地 Nest HTTP 集成 3/3 通过；新增普通支付集成验证原始 JSON 字节验签、AES-GCM 解密、金额不匹配拒绝、跨账户隔离、回调幂等和权益开通。微信网关及登录请求均由测试拦截，不向线上写入数据。旧接口集成的服务模板数量断言由 2 修正为当前 5；未修改业务额度。
- HBuilderX 5.26 的 H5 与 mp-weixin 完整构建通过，产物位于忽略目录 .preview/payment-h5 和 .preview/payment-mp，未改写已跟踪开发产物。保留既有 uniCloud 未配置、H5 非模块静态脚本和 6 处 Harmony UA 检测提示。
- 实际 H5 构建 + Edge：待支付/已支付、支付入口、H5 支付拦截、刷新失败保留订单及恢复、历史模拟订单只读、模拟模式隔离、320px 无横向溢出通过；pageerror=0，付款写请求=0。截图为 .preview/payment-member-pending.png 与 payment-member-paid-320.png，执行脚本 check-payment-ui.cjs。
- 管理后台 typecheck、5 项单元测试、生产构建通过；使用已安装 Edge 执行既有 9 项 E2E 全部通过。默认 Playwright 命令因未安装指定 Chromium 版本失败，因此用忽略目录 admin/.runtime/playwright.edge.config.mjs 仅替换浏览器 channel，保持测试内容不变。
- 本次修改的支付文件 Prettier 检查通过，git diff --check 通过。后台完整 format:check 仍报告 18 个未修改文件的既有格式问题，未对无关代码做批量格式化。
- designmd lint 返回 0 个错误、7 个 orphaned-token 警告。premium strict audit 返回 53 条 actionless-button，canonical unresolved=0；报告保存在 .preview/payment-audit.json。报告中的 uni-app @tap 事件未被检查器识别；会员按钮已逐一核对事件与父页方法连接，未修改检查器或隐藏报告。
- 未提供真实商户参数，WECHAT_PAY_ENABLED 默认 false；未部署生产服务、未执行真实扣款或微信真机收银台验收。真实退款及退款后的权益回收尚未接入，不能以模拟撤销代替真实退款。

### 会员入口暂时隐藏

按用户要求将 MEMBERSHIP_ENTRY_ENABLED 设为 false，同时隐藏“我的”会员卡片、阻止 openMembership 导航并关闭会员页渲染。额度用完弹窗仅提示删除记录释放名额，按钮为“知道了”，不跳转会员中心。后端支付配置仍默认关闭，管理后台继续只读查询。

入口隐藏后 39 项小程序回归通过；H5 和 mp-weixin 完整构建通过，已同步仓库跟踪的小程序产物；当前完整构建使用压缩输出，清理不再生成的旧源码映射，不影响运行文件。Edge 验证会员卡片不存在、程序导航不进入会员页、额度弹窗无购买跳转、320px 无横向溢出，pageerror=0。脚本与截图位于忽略目录 .preview/check-hidden-entry.cjs 和 .preview/membership-entry-hidden.png。


## 2026-10-15 个人主体虚拟支付

道具lifetime_member，永久会员990分。前端改用wx.requestVirtualPayment，支付前强制刷新微信登录，未开通Apple IAP时阻止iOS购买；会员入口继续隐藏。服务端加密保存session_key，以平台交易号幂等处理发货与全额退款，5分钟查单补发。

后端构建、类型检查、lint及60项单元测试通过；前端41项测试、3项真实Nest HTTP集成通过（模拟微信平台，无实际扣款）。小程序与H5构建完成；Edge验证会员待支付/已支付、H5支付拦截、刷新错误恢复、模拟隔离和320px无横向溢出，pageerror=0；独立验证入口隐藏、跳转阻止与额度弹窗无购买跳转。

管理端类型检查、5项单测、构建及9项Edge E2E通过。全量格式检查仍有16个未改文件的既存警告；本次改动文件格式通过。designmd lint无错误、7个既存token警告。premium strict审计仍有53项已知@tap识别误报、unresolved=0，运行验证确认实际按钮事件可用。

官方部署清单逐项结果见deploy/个人主体虚拟支付.md。尚未完成线上部署、MP推送URL验证、真机支付与账单对账，因此不宣称可上线收款。

2026-10-15 后续本地测试调整：按用户要求已将会员入口开关改为true并重新编译小程序；服务端支付开关仍独立控制，线上需部署新版后端后测试虚拟支付。此前入口隐藏验证为调整前的历史证据。


## 2026-10-15 会员页小程序样式兼容修复

用户报告微信开发者工具中仅会员页失去样式。定位到MembershipView的组件WXSS包含button[disabled]和button:focus-visible标签/属性选择器，违反微信自定义组件仅使用class选择器的限制（https://uniapp.dcloud.net.cn/tutorial/syntax-css）。已将这两条规则限定为H5，保留浏览器禁用状态和键盘焦点样式。

小程序重新编译成功，产物检查确认会员WXSS只含class选择器、绿色摘要卡与按钮规则保留，JS/WXML/WXSS的scope ID一致。当前环境没有运行微信开发者工具，实际小程序画面需在用户工具中刷新复核。

H5重编译和Edge会员页待支付/已支付、错误恢复、模拟隔离、320px布局检查通过；产物确认H5仍保留禁用状态与focus-visible规则。

## 2026-10-20 会员中心信息流与活跃风格重设计

- 信息流调整为会员通行证、会员权益、永久方案、折叠订单入口、可展开常见问题。移除商户结算费率、结算周期和商户总支付限额。保留后端价格、真实开通状态、模拟支付提示与全部收银台/订单操作。
- 运行时会员色板记录于 styles/_tokens.scss，视觉与交互约束同步 DESIGN.md / UX-CONTRACT.md。没有新增依赖或更改支付 API；测试未知金额显示破折号。已开通、加载中、错误和未开放均禁用下单。
- 个人端单元 41/41、Nest HTTP 集成 4/4 通过。已有全应用 Edge UI 回归 tests/ui.e2e.cjs 通过，pageerror=0。后台 format:check、typecheck、单元 5/5、生产构建、Edge E2E 11/11 均通过。
- 专项浏览器脚本 .preview/check-membership-club.cjs 在实际 H5 构建上验证：320/390/1280px 无页面横向溢出、免费与永久会员、未开放/模拟/真实支付入口、订单空态与展开、FAQ 鼠标与 Enter 键盘展开收起、慢请求禁用、503 错误后刷新恢复、已开通禁止重复购买；付款写请求 0，pageerror=0。首次检查发现新增 disclosure 缺少 role/tabindex，已补齐并复测通过。截图 .preview/membership-club-overview.png、membership-club-320.png、membership-club-390.png、membership-club-active.png。
- HBuilderX 5.26 的最终 H5 与 mp-weixin 构建通过，输出 .preview/timebook-h5 和 .preview/membership-club-mp。通过 HX_APP_ROOT / UNI_CLI_CONTEXT 使用内置依赖，未添加依赖包。保留 uniCloud 未启用、静态脚本以及第三方组件 Harmony UA 检测等既有编译警告。未手动修改 unpackage 产物。
- 修改文件 Prettier 与 git diff --check 通过。designmd lint：0 errors、7 个已有 orphaned-token 警告。
- premium strict 审计原始报告 .preview/membership-club-audit.json：59 项 actionless-button、canonical unresolved=0；均为 @tap 或 Reka 组合按钮未被静态规则识别，未修改审计器或隐藏报告。会员页所有按钮已逐个核对 @tap，新增展开操作已在浏览器验证，不据此声称 strict 审计通过。
- 尚未在微信开发者工具/真实手机执行验收，未部署或执行实际付款。
## 2026-10-27 统计页控件与信息密度优化

- 历史/估算切换降低边框与阴影强度，选中态采用蓝色文字；月份和币种合为一行，翻月按钮保留44px热区并移除重复底块，回到本月放入说明行。
- 金额摘要不重复顶部月份；仅当存在其他币种记录时保留额外币种汇总，单币种不再重复相同总额，当前所选币种无记录但有其他币种时仍可切换。统计口径不变。
- `pnpm --dir subscription test`：90/90通过；改动 Vue/SCSS 格式和差异检查、设计令牌漂移检查通过。HBuilderX 5.26 mp-weixin 编译通过，产物 `.preview/stats-refined-mp`，保留既有第三方组件和 uniCloud 警告。
- `.preview/check-stats-layout.cjs` 使用真实 Vue 组件源文件与编译后的真实样式做隔离浏览器验证，避免全应用 H5 预览的既有运行时阻断。320/390px留白及工具栏无溢出、单/多币种摘要、月份选择、币种选择、历史/估算切换通过，pageerror=0；截图 `.preview/stats-refined-320.png`、`.preview/stats-refined-390.png`、`.preview/stats-refined-multicurrency.png`。原生 picker 用浏览器适配器替代，不能代替微信真机 picker 验收。
- 静态 premium strict 审计保留 `.preview/stats-refined-audit.json`，其 @tap/组合按钮识别限制仍在，不宣称全量 strict 通过。尚未微信真机验收，未部署。
## 2026-10-27 免费10条额度与第11条会员推荐页

- 后端 `FREE_SUBSCRIPTION_LIMIT=10` 为唯一额度来源，前端继续读取真实 quota。首次进入新增、复制、保存时本地额度已满，以及服务端返回 SUBSCRIPTION_LIMIT_REACHED，都直接进入会员推荐态。已有订阅编辑不受影响。
- 复用 MembershipView 及现有收银台。推荐首屏是用量→无限额度、永久会员真实价格与开通按钮，保留「暂不升级，返回」；免费提醒、统计、导出及删除保留历史账单的说明明确。服务端未开放、读取失败或设备不支持支付时不会创建可扣款订单。
- 保留新建日期、复制字段和已填写草稿，用户返回或在权益确认后点击继续添加；不自动付款、保存或虚构开通成功。原生会员入口仍为 index，editor 草稿通过原有页面帧保留。普通会员中心继续显示原有界面。
- 前端97项单测通过，包含6项额度/草稿/迟到服务端拦截测试及新增原生会员页返回测试。后端21套、121项单测通过（排除既有需占用本机3002端口的 admin.module.spec.ts）；后端构建、相关 ESLint、改动文件格式及设计令牌漂移检查通过。
- 实际Nest HTTP的订阅、会员、历史和虚拟支付回归4/4通过。免费第1—10条新增成功、第11条403、模拟会员权益生效后第11条可创建、撤销模拟权益后已有11条保留且剩余额度为0均已验证。没有真实交易。
- `.preview/check-membership-quota.cjs` 在真实Vue会员组件和真实页面方法上验证320/390px、首屏可见开通按钮、不自动下单、返回、停售、读取失败重试、虚拟支付平台不支持、模拟权益确认及原日期/字段继续填写，pageerror=0。截图 `.preview/membership-quota-320.png`、`.preview/membership-quota-390.png`；平台API由测试适配器提供，不替代微信真机交易验收。
- HBuilderX 5.26 mp-weixin编译通过，产物 `.preview/membership-quota-mp`。designmd lint为0错误、7项既有令牌警告。premium strict原始报告 `.preview/membership-quota-audit.json` 为59项actionless-button、unresolved=0，包含 @tap 与组合按钮识别误报，未宣称strict全通过。
- 无数据库迁移或新环境变量。生效需要部署新版API并重新编译/发布小程序，尚未部署或进行真机交易验收。
