# 新增、编辑与订阅详情 UI 重构报告

日期：2026-10-20。

依据用户提供的「新增订阅-UI」「订阅详情-UI」开发提示词、规范、原型及效果图实施。先完成两页摸底，收到用户“同步，开始执行”确认后，依次改造新增/编辑和详情。公共令牌沿用已有实现，没有复制两套 assets。

## 1. 本次文件清单

以下仅列本轮实际修改/新增文件，不包含开始前工作区已有的未提交改动。

| 文件                                                           | 说明                                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `components/subscription/SubscriptionFormView.vue`             | 新增/编辑共用的实时预览、模板选中态、品牌色、分组表单、提醒信息条、开关外观与底部保存栏。 |
| `components/subscription/SubscriptionDetailView.vue`           | 服务主卡、金额日期、周期进度、信息格、提醒时间线、处理卡及底部操作栏。                    |
| `components/subscription/PageHeader.vue`                       | 增加可选的吸顶场景及滚动外观参数，返回按钮使用可见底块与点击热区两层结构。                |
| `components/subscription/subscription-presentation.js`（新增） | 两页复用的倒计时配色、品牌色渐变和只读周期进度计算，不回写表单或接口数据。                |
| `pages/subscription/index.vue`                                 | 传递现有金额/倒计时格式化函数，收集并传递纯展示滚动偏移，切换视图时复位。                 |
| `styles/_subscription-flows.scss`（新增）                      | 新增、编辑、详情共用的外观、吸顶、安全区、底部避让、按压和减少动态效果样式。              |
| `styles/subscription.scss`                                     | 引入共用样式；将旧信息格的后代 view 规则收窄为直接子项，避免新图标和状态点继承格子尺寸。  |
| `tests/subscription-presentation.test.mjs`（新增）             | 月末锚点、闰年、周期边界、倒计时阈值、渐变生成及数据不变性测试。                          |
| `docs/subscription-flows-ui-report.md`（新增）                 | 本报告。                                                                                  |

路径相对 `subscription/`。未修改 `subscription-page-logic.js`、`subscription-remote.js`、`subscription-data.js`、API、后端或公共工具函数；未删除文件。构建输出到忽略目录 `.preview/`，未手工修改 `unpackage`。

## 2. 新增/编辑区块 → 代码绑定

| 区块         | 绑定与事件                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 导航         | `editingId` 决定标题；原 `back` 事件；`scrollOffset > 8` 只切换外观；胶囊位置继续由 `PageHeader` 读取平台 API。                |
| 说明和预览   | `form.name/category/color/amount/currency/nextBillingDate`；首字、渐变、金额及倒计时均为只读展示。空名称显示“服务名称”和“?”。  |
| 模板         | 原 `serviceTemplates` 与 `apply-template`，仍走完整 `applyTemplate`；选中模板名仅保存在视图本地。                              |
| 基本信息     | 原 `form.name/plan/category/color`；保留 `.trim`、长度限制、分类选择与颜色赋值。                                               |
| 扣费信息     | 原 `amount/currency/cycle/cycleValue/payment/nextBillingDate/autoRenew/trial/trialEndDate`；原 picker、switch 及对应事件不变。 |
| 提醒节点     | 原 `reminderOptions`、`form.reminders` 与 `toggle-reminder`。                                                                  |
| 预计最近提醒 | 原 `formReminderPreview`，继续使用原提前天数与用户提醒时间计算；全不选显示“未设置提醒”。                                       |
| 补充信息     | 原 `form.note/cancelGuide`，保留占位文案、500/300 字限制。                                                                     |
| 保存         | 原 `save`、`busy`、`formError`；保留保存中、禁用、校验、额度、重复提醒和保存后进入详情。                                       |

编辑订阅同步使用新外观，保留“编辑订阅”“更新这项订阅”“保存修改”，并继续隐藏模板。原未保存返回确认不变。

## 3. 详情区块 → 代码绑定

| 区块     | 绑定与事件                                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主卡     | 原 `subscription.logo/color/name/category/plan` 和 `getStatus/statusText`，套餐存在时另行保留。                                                      |
| 下次扣费 | 原 `cycle/autoRenew/amount/currency/nextBillingDate` 和 `formatMoney/formatDate/daysText`。金额为 0 仍显示数值，只有原缺失金额状态显示“金额待补充”。 |
| 周期进度 | `cycle/anchorDay/nextBillingDate` 反推周/月/季/半年/年周期；进度限制在 0–100%；自定义、一次性、未知周期隐藏。                                        |
| 信息格   | 原 `cycleText`、`payment`、`category`、`autoRenew`。                                                                                                 |
| 提醒计划 | 原 `reminders`、`notificationEnabled`、`selectedNextReminderText`；节点可横向滚动。                                                                  |
| 本期处理 | 原显示条件、`renewalLocked`、`daysUntil` 和 `processTitle`；保留提前记录、已确认结果及撤销分支。                                                     |
| 操作     | 原 `confirm-renewal/undo-renewal/snooze/cancel/manage/edit/back` 事件全部保留。                                                                      |
| 其他信息 | 原试用提示、最近三条续费记录及总次数、备注、取消路径，保持原显示条件。                                                                               |

## 4. 与设计稿的差异及原因

- 计费周期、付款渠道、自定义周期天数、试用截止日仍显示，因此表单长度会随真实数据变化。
- 模板包括服务端已有的 88VIP，名称、Logo 和品牌色使用真实模板数据，不用原型的示例值替换。
- “即将到期”继续由服务端按所选提醒窗口判断；倒计时胶囊独立采用 7/14 天视觉阈值，逾期沿用红色语义。
- 详情“最近提醒”保留现有说明，并不总是具体日期。不能发送时使用橙色信息条。
- “通知可用/仅站内提醒”原本不可点击，继续作为状态展示，没有添加跳转。
- 关闭自动续费、一次性、待处理、提前续费、本期已确认等状态继续使用原文案和操作分支，不套用效果图中的固定“扣费”文字。
- 详情保留套餐、续费记录、试用提示、备注和取消路径；页面高度不固定为效果图高度。
- 选择器沿用 uni-app 平台 picker；开关保留原生 switch 接收交互，装饰层呈现设计中的轨道和滑块。
- 图标复用项目的 uni-icons；分类使用现有回形针图标，未另引入图标依赖。数字字体继续按规范使用系统 DIN 及回退字体。
- 返回按钮可见底块为设计尺寸，外层热区至少 44×44；提醒节点和币种可见底块保持设计高度，依所在行/按钮保留点击区域。

## 5. 验证

已完成：

- 个人端现有单元测试 43/43；新增展示计算测试 4/4。
- 本机 Nest HTTP 集成测试 4/4；测试使用隔离内存后端，微信调用被测试拦截，没有线上写入和真实付款。
- 个人端原有浏览器流程回归：保存、编辑、未保存返回确认、续费、撤销、列表/日历/设置等，`pageerror=0`。
- 专项浏览器状态矩阵：空表单、模板、长服务名、颜色、金额、币种、分类/周期/付款渠道选择器、日期选择器、自动续费、试用截止、提醒全不选及校验、提醒预览更新、备注/取消路径、保存、吸顶、底部避让、320px 无横向溢出。
- 详情专项：缺失金额、已填金额、零金额、超过 14 天、自动续费关闭、多个提醒节点横向滚动、自定义周期隐藏进度、本期已处理及撤销入口、编辑模板隐藏、减少动态效果。
- HBuilderX 内置 5.26 编译器的最终 H5 和 mp-weixin 构建；小程序输出 `app.wxss` 未包含 `:has`、`@media` 或 `prefers-reduced-motion`。
- 令牌生成器 `--check`；修改文件 Prettier；`git diff --check`。
- 配置要求的后台格式、类型检查、5 项单测、生产构建和 11 项 Edge E2E。
- DESIGN.md lint：0 errors，7 个既有 orphaned-token warnings。

静态 strict 审计未通过：52 项均为 `affordance.actionless-button`，canonical unresolved=0。原始报告保存在 `.preview/subscription-flows-audit.json`；检查器不识别现有 uni-app `@tap` 与部分组合按钮。此次两页按钮均核对原事件，相关操作已在浏览器验证，没有修改或屏蔽审计器结果。

编译保留既有 uniCloud 未启用、H5 静态脚本及第三方组件的 6 处 Harmony UA 检测警告。

## 6. 截图与本机复验

截图来自实际 H5 构建的 Edge，视口 390×844（另有 320px 检查），不是微信开发者工具截图。尚未完成微信开发者工具/真机上的键盘、安全区及原生 picker 验收。

- [新增首屏](../.preview/flows-add-top.png)
- [新增底部与吸顶](../.preview/flows-add-bottom-empty.png)
- [详情金额缺失首屏](../.preview/flows-detail-missing-top.png)
- [详情金额缺失底部](../.preview/flows-detail-missing-bottom.png)
- [详情金额已填写](../.preview/flows-detail-amount.png)
- [详情正常状态与多提醒，320px](../.preview/flows-detail-normal-320.png)

专项运行脚本：`.preview/check-subscription-flows.cjs`；新增单测：`node --test subscription/tests/subscription-presentation.test.mjs`；原个人端回归：`node subscription/tests/ui.e2e.cjs`。

小程序验证构建位于 `.preview/subscription-flows-mp/`，可导入微信开发者工具查看。发布及现有开发工具的 `unpackage` 输出未替换。

## 7. 待确认事项

字体补充修正：为两页原生输入框显式应用 `--font`，为金额/币种输入、日期、天数、自定义周期和记录计数补齐 `--font-num` 与 `tabular-nums`，并将区块标题和输入值字重对齐规范。Edge 实测金额、币种、预览日期和金额均采用规范字体栈，名称采用系统字体栈。当前 Windows 实际数字字体为规范允许的 Bahnschrift 回退；项目未附带 DIN 字体文件，不将字体栈声明视为所有设备均加载了 DIN Alternate。字体专项脚本为 `.preview/check-subscription-fonts.cjs`，已通过实际字体规则与页面状态检查。

无新增业务决策需要确认。下一步建议在微信开发者工具或真机复核原生控件、输入键盘和安全区；本报告不将 H5 截图视为小程序真机验收通过。
