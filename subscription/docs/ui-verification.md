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

## 2026-10-14 普通微信支付接入

会员页沿用原有组件和绿色账簿样式，按服务端商品 channel 区分普通微信支付、模拟支付及未开放状态。真实支付入口显示 ¥29.90，调用微信收银台；取消和异常保留待支付订单并提示刷新。正式支付开启时历史模拟订单只读，真实订单不提供撤销模拟权益入口。支付签名和开通条件见 deploy/普通微信支付.md。

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
