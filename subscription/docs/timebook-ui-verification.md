# 蓝墨时间簿 UI 重构验收

日期：2026-10-16。产品和视觉依据见根目录 DESIGN.md，交互与业务所有权见 UX-CONTRACT.md。

## 改动

- 个人首页改为顶部新增入口、支出摘要、时间队列和待处理事项；合并重复微信通知入口。
- 订阅列表把金额和倒计时独立成列，长名称换行，保留原有分类、状态、搜索与排序。
- 详情、表单、日历、统计、偏好、会员、空态与失败状态沿用同一蓝墨色系统。小屏 H5 为主要正文与列表辅助文字设置最小字号。
- H5 760px 起使用侧栏和双栏首页，表单与详情独立居中；手机继续五项底部导航。
- H5 将 uni-app 宿主上的 aria 属性同步到真实 input/textarea，名称为空时的错误字段可获取焦点；微信端编译时移除 DOM 适配实现。
- 管理端按运行总览、订阅与账号、会员与消息、系统分组；首页先展示真实服务配置与通知异常，再展示指标和全宽订阅速览；浅色、深色主题一致。
- 未修改业务 API、续费状态机、权限、计费或支付开关。所有浏览器测试数据仅在隔离内存后端中创建，生产页面没有测试数据或登录旁路。

## 已执行的验证

| 验证 | 结果 |
| --- | --- |
| `pnpm --dir subscription test` | 41/41 通过 |
| `pnpm --dir subscription test:integration` | 4/4 通过；隔离 Nest HTTP 实例 |
| `pnpm --dir admin typecheck` / build 内类型检查 | 通过 |
| `pnpm --dir admin test` | 5/5 通过 |
| `pnpm --dir admin format:check` | 通过 |
| `pnpm --dir admin build` | 通过 |
| 管理端 Playwright + 已安装 Edge | 11/11 通过 |
| 个人端真实 H5 构建 + Edge | 完整流程通过，pageerror=0 |
| HBuilderX 5.26 H5 / mp-weixin 构建 | 通过；输出在 .preview/timebook-h5 和 .preview/timebook-mp |
| DESIGN.md lint | 0 errors，7 个已有镜像 token 引用 warnings |
| `git diff --check` | 通过 |

个人端自动验收源码为 `subscription/tests/ui.e2e.cjs`，命令 `pnpm --dir subscription test:ui`。需先安装 admin/backend 依赖并构建 backend，将个人端 H5 编译到 `.preview/timebook-h5`；脚本使用 Windows 上已安装的 Edge。它启动临时端口上的静态站点和内存 Nest 实例，拦截并转发业务请求至本机，阻止其他远程请求，结束后关闭浏览器与服务。

覆盖：首页金额显隐、搜索/清空/无结果、排序 Escape、详情、编辑保存、确认续费及撤销、新增必填校验和保存、删除及回收站语义、日历翻月/今天、统计周期与币种选择弹层、偏好页、独立空账号、首次错误和重试、断网保留数据与恢复、减少动态效果、输入名称。布局检查为 320、390、760、1024、1280px，页面无横向溢出。管理端另外覆盖服务器分页、URL 返回、中文合成、查询竞态、模态焦点恢复、完整 IPv6、主题持久化、部署 CSP 与子目录。

## 预览

以下均为真实构建配合隔离测试数据的浏览器截图，不代表生产用户记录：

- `.preview/timebook-home-mobile.png`：个人首页，390px。
- `.preview/timebook-home-desktop.png`：个人首页，1280px。
- `.preview/timebook-list-320.png`、`timebook-form-320.png`、`timebook-detail-320.png`。
- `.preview/timebook-calendar-320.png`、`timebook-stats-320.png`、`timebook-profile-320.png`。
- `.preview/timebook-empty.png`、`timebook-error-320.png`。
- `admin/test-results/overview-desktop.png`、`subscriptions-mobile.png`、`user-access-mobile.png`。

## 静态审计和平台边界

strict 原始输出保存在 `.preview/timebook-audit.json`，canonical unresolved=0。静态审计不是零告警：58 条均为 actionless-button，53 条是 uni-app `@tap`，其中两个标签还包含比较符 `>`；5 条是官方 Reka DialogClose/SheetClose 的 as-child 事件注入。未修改检查器或屏蔽规则。相关业务点击、重试和关闭行为已用浏览器运行验证。

HBuilderX 的既有提示包括 uniCloud 未配置、两处传统静态脚本、6 处第三方组件鸿蒙 UA 兼容提醒。未在微信开发者工具或真机进行本轮交互验收；没有执行真实支付、线上部署或生产数据写入。


## 首页视觉修订：移除侧边弧形强调

按用户明确反馈，移除彩色侧边竖条、圆角容器和 inset shadow 侧边强调。首页改为开放式金额摘要、横排数量与平面续费列表，移除口号；日期直接排版。管理端运行摘要改为开放分区，详情、导航、表单标题及统计等页面去掉同类装饰边。该限制已写入 DESIGN.md，后续页面继续遵守。

本轮个人端完整 UI 流程通过，包含 320/390/760/1024/1280px；管理端 11 项 E2E 通过，H5、管理端与 mp-weixin 构建通过。截图沿用本文预览路径并更新为本轮结果。


### 反馈纠正：保留正常卡片与明确分界

上一轮将「移除侧边彩色弧形装饰」扩大为移除整个首页的卡片，误解了用户意图。本轮恢复金额摘要、指标组、续费列表和待办的白底、统一细边框、普通圆角及区块间距；仅移除彩色侧边竖条和 inset 侧边强调。管理端摘要同样恢复普通容器边界。个人端完整浏览器流程通过，预览截图已更新；业务逻辑没有改动。


### 用户参考图修订

首页采用浅蓝背景和完整概览卡，将标题、新增、金额及指标合并；非交互的倾斜票据/时钟由原生样式构建。续费分组各有白色底和边界，增加已有服务标识，去掉重复日期，时间范围明确为「未来7天」「8–30天内」。不添加虚构折叠交互，不使用彩色侧边弧线。金额为空时显示「金额待补充」，无数据时仍沿用真实空态。

个人端 41 项单测和完整浏览器流程通过；320、390、760、1024、1280px 未见页面横向溢出。H5 实际构建已完成并检查截图。


### 第二张参考：全部订阅

调整搜索、分类、状态、排序摘要、列表与新增入口。移除重复悬浮新增；补充筛选 aria-pressed 和记录完整可访问名称，保留原事件与数据逻辑。状态与分类两条横向滚动区域继续可操作，长名称、金额为空和多币种均有实际浏览器覆盖。新增预览 `.preview/timebook-list-mobile.png`（390px），320px 预览仍在 `.preview/timebook-list-320.png`。

已执行个人端41项回归、真实H5+内存Nest+Edge完整UI流程，新增验证分类、状态、金额排序、缺失金额以及390px截图；所有断言通过，pageerror=0。H5与微信小程序编译通过，微信真机未验收。


## 全部剩余页面：统一浅蓝参考风格

覆盖日历、统计、订阅详情、新增/编辑、我的、默认提醒规则、会员中心、排序弹层及加载/空/错误状态。共享外观在 styles/_surfaces.scss，由 subscription.scss 引入。日期明细、统计图、账号设置在宽屏分别采用适合内容的分栏，表单与详情继续自然高度及原返回栈。

已完成：41项单测、4项隔离HTTP集成、完整Edge UI流程；320/390/760/1024/1280px检查无页面横向溢出，pageerror=0。新增运行验证包括提醒节点保存与恢复、日历进入详情、未来30天图文一致、会员购买未开放的禁用语义、表单草稿继续/放弃、排序弹层焦点与关闭。H5和微信小程序构建成功；原有uniCloud、静态脚本及鸿蒙UA提示保留，未进行微信真机或真实支付。

截图更新：timebook-calendar-mobile.png、timebook-stats-mobile.png、timebook-profile-mobile.png、timebook-detail-mobile.png、timebook-membership-mobile.png；320px补充timebook-form-320.png、timebook-reminders-320.png、timebook-sort-320.png。宽屏为timebook-calendar-desktop.png、timebook-stats-desktop.png、timebook-profile-desktop.png、timebook-membership-desktop.png。均位于 .preview，截图使用隔离测试账号。

静态strict审计为57项已知平台识别告警，canonical unresolved=0：52项uni-app @tap（含比较符解析），5项Reka as-child关闭事件；未屏蔽规则。DESIGN.md lint为0 errors、7个已有镜像token warnings。本轮改动的格式检查与diff空白检查通过。
