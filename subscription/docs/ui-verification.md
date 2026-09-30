# UI 重构验证记录

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
