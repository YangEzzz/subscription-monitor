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
业务依据为 subscription/docs/前后端联调说明.md 与现有 API；演示会员和站内提醒不可包装成真实支付或微信通知。

## Colors

运行时唯一来源为 subscription/styles/\_tokens.scss，本文件镜像其值（Model B）。
primary 用于主操作、选中态；foreground 用于主文字；muted 用于辅助文字；border 分隔；tint 标注次要选中面。
danger 与 amber 同时配状态文字；第三方品牌色仅用于服务标识。图表类别颜色由现有数据映射保留。
当前仅提供浅色主题。高对比度模式保留系统边框和焦点。

## Typography

中文使用系统黑体栈，金额及日期使用 numeric 字体栈和等宽数字。
标题约 20px、正文 14px、辅助文字至少 12px；金额 32px。
长服务名称允许截断，详情及备注允许换行。货币金额允许换行以容纳多币种。

## Layout

移动优先，32rpx 页面留白、32rpx 主区间隔；五个主导航项顺序固定。
H5 容器最大 480px，宽屏居中呈现同一完整移动应用；底部导航匹配容器。
页面使用一个 scroll-view，底部留出导航及安全区。筛选和模板使用横向滚动。
小程序标题预留胶囊区域。初次加载提供静态骨架，刷新保留当前内容。

## Elevation & Depth

白色面板与浅灰页面构成层次，普通内容面板没有阴影。浮动新增按钮和模态遮罩可用轻微阴影。

## Shapes

面板 24rpx 圆角，控件 16rpx；日期签为小型方形，品牌标识圆角矩形。

## Components

共享布局和控件样式由 subscription/styles/subscription.scss 拥有。
SubscriptionRow 负责首页续费行；SubscriptionTabBar 负责导航；EmptyStateView 负责空态。
StatSummaryCard 将周期筛选独立为整行，避免金额与筛选竞争空间。
uni-app picker、switch、showModal 使用平台交互；详见 UX-CONTRACT.md。
按钮具备焦点、按下、禁用态；减少动态效果偏好下停用动画。

## Do's and Don'ts

- 先展示金额、日期，再展示解释；使用真实聚合数据。
- 用颜色和文字同时表达状态，保持操作目标至少 44px。
- 不增加装饰性趋势或虚构增长数据。
- 不修改接口、计费规则或用户已有数据。
