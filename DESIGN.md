---
version: alpha
name: 续订清单
description: 以续费日期为线索的轻量订阅管理工具
colors:
  primary: "#146747"
  deep: "#104e37"
  foreground: "#172a22"
  muted: "#65766d"
  border: "#dfe7e2"
  background: "#f3f5f4"
  surface: "#ffffff"
  tint: "#e8f1ec"
  danger: "#b43d47"
  amber: "#966018"
typography:
  sans:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif"
  numeric:
    fontFamily: "'Bahnschrift', 'DIN Alternate', Arial, sans-serif"
rounded:
  DEFAULT: "12px"
  sm: "8px"
spacing:
  section-gap: "16px"
  page-gutter: "16px"
components:
  button: {}
  card: {}
  input: {}
  dialog: {}
---

# 续订清单 Design System

## Overview

面向中文用户的移动端订阅工具，首要任务是看清下一笔扣费并处理续费事项。
产品界面采用纸质账簿的秩序：左侧日期签、右侧金额、安静的分隔线。
日期签是识别特征；表单、筛选和导航保持常见操作习惯。保留绿色品牌色，避免营销渐变、装饰图表与密集阴影。
中文为默认语言，货币代码保留 ISO 表示，不据此推断日本市场。
业务依据为 subscription/docs/前后端联调说明.md 与现有 API；账号额度展示真实后端状态，会员为 ¥9.90 永久方案。个人主体虚拟支付由 WECHAT_VIRTUAL_PAY_ENABLED 控制，道具 lifetime_member 售价990分，收银台、支付通知与查单遵循 deploy/个人主体虚拟支付.md；配置默认关闭，开通以服务端确认结果为准。模拟购买由独立后端开关控制且明确不实际扣款，真实支付开启时停用模拟写操作。会员中心沿用绿色和账簿样式，以账号状态、权益、标价、支付与订单为顺序；撤销测试权益只用于模拟订单并使用页面内确认。微信通知依据已配置模板、授权类型与状态、定时任务与发送记录显示真实状态。

## Colors

运行时唯一来源为 subscription/styles/\_tokens.scss，本文件镜像其值（Model B）。
primary 用于主操作、选中态；foreground 用于主文字；muted 用于辅助文字；border 分隔；tint 标注次要选中面。
danger 与 amber 同时配状态文字；第三方品牌色仅用于服务标识。图表类别颜色由现有数据映射保留。
移动应用仅提供浅色主题。桌面 Vue 管理后台增加独立的深色主题，不改变移动应用。高对比度模式保留系统边框和焦点。

管理后台由 `admin/src/style.css` 提供桌面适配：primary→`--primary`、deep→`--primary-hover`、foreground→`--foreground`、muted→`--muted-foreground`、border→`--border`/`--input`、background→`--background`、surface→`--card`、tint→`--accent`、danger→`--danger`、amber→`--warning`。数值与移动端镜像一致；Tailwind v4 `@theme inline` 将语义变量映射到共享 UI 控件。

后台深色语义值：background `#111a16`、foreground `#e3ece6`、card/sidebar `#19251f`/`#16211b`、muted/secondary text `#24342b`/`#a3b5aa`、border/input `#30453a`、primary/hover `#7dcaa4`/`#a1ddbe`、primary text `#10261a`、accent `#263f31`、danger/surface `#ff9aa5`/`#3a242c`、warning/surface `#edbd79`/`#352d1f`。后台 CSS 是这些桌面扩展值的运行时来源，本文件记录镜像（Model B）。

## Typography

中文使用系统黑体栈，金额及日期使用 numeric 字体栈和等宽数字。
标题约 20px、正文 14px、辅助文字至少 12px；金额 32px。
长服务名称允许截断，详情及备注允许换行。货币金额允许换行以容纳多币种。

## Layout

移动优先，32rpx 页面留白、32rpx 主区间隔；五个主导航项顺序固定。
H5 容器最大 480px，宽屏居中呈现同一完整移动应用；底部导航匹配容器。
页面使用一个 scroll-view，底部留出导航及安全区。筛选和模板使用横向滚动。
小程序标题预留胶囊区域。初次加载提供静态骨架，刷新保留当前内容。

桌面管理后台按用户指定的 shadcn-vue-admin 参考采用 240px 侧栏、68px 顶栏、32px 内容留白和四列概览卡片。保留品牌绿和账簿的数据秩序，以订阅名称、金额、扣费日期作为订阅速览重点；不引入虚构增长率或装饰图表。960px 以下采用模态导航抽屉，600px 以下统计卡片两列；数据表格仅自身横向滚动，页面自然纵向滚动。后台标题 27px，正文 14px，表格 12px；共享数字字体用于统计、金额和日期。完整长值通过记录详情可访问。

## Elevation & Depth

白色面板与浅灰页面构成层次，普通内容面板没有阴影。浮动新增按钮和模态遮罩可用轻微阴影。

## Shapes

面板 24rpx 圆角，控件 16rpx；日期签为小型方形，品牌标识圆角矩形。

## Components

2026-10-16 管理后台正式接入 shadcn-vue 2.8.2 官方 CLI（components.json，reka-nova）；Button、Badge、Dialog、Sheet、Input、Table、Card 源码由官方注册表生成并由页面直接使用。`src/style.css` 将 shadcn 的 card/popover/secondary/accent/ring/destructive 前景及背景映射到既有主题，保留中文系统字体，不加载远程字体。业务状态由 StatusBadge 组合官方 Badge；AppDialog 组合官方 Dialog/Sheet 并提供中文关闭与焦点恢复；不再维护同名手写基础控件。

共享布局和控件样式由 subscription/styles/subscription.scss 拥有。
SubscriptionRow 负责首页续费行；SubscriptionTabBar 负责导航；EmptyStateView 负责空态。
StatSummaryCard 将周期筛选独立为整行，避免金额与筛选竞争空间。
uni-app picker、switch、showModal 使用平台交互；详见 UX-CONTRACT.md。
按钮具备焦点、按下、禁用态；减少动态效果偏好下停用动画。

管理后台是独立 Vue 3 桌面表面，替代旧原生 HTML 实现：`admin/src/components/ui` 保存官方 shadcn-vue 生成的基础组件，AppDialog/StatusBadge 提供业务组合；AdminTable、AsyncState、ServiceStatus 和 `lib/useAdmin.ts` 拥有跨页面查询与反馈。标准 Vite 构建输出 `admin/dist/index.html` 与 `assets` 中独立 JS/CSS，前端 Nginx 镜像与后端 API 分别构建部署；不手工修改构建产物。浅色面板维持无阴影，遮罩对话框可使用阴影；圆角仍为面板 12px、控件 8px。主题只持久化偏好，不持久化业务记录和接口地址。

## Do's and Don'ts

- 先展示金额、日期，再展示解释；使用真实聚合数据。
- 用颜色和文字同时表达状态，保持操作目标至少 44px。
- 不增加装饰性趋势或虚构增长数据。
- 不修改接口、计费规则或用户已有数据。
