# 续订清单 UX Contract

## Evidence and scope

本次为现有单页 uni-app 的 UI 重构，依据 subscription/docs/前后端联调说明.md、subscription/api/subscriptions.js、subscription/pages/subscription/subscription-remote.js。
旧需求中真实微信消息、登录、支付能力尚未实现；按当前服务端能力显示演示提示，不承诺已上线。

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

路径均相对 subscription/components/subscription，除明确标明 pages、styles 或 api 者。

## Dataset and navigation policy

API 分页拉取完整数据供统计；列表仅分批渲染，加载更多属于本地显示操作。
搜索、分类、状态在父页内保持；切换标签后仍保留。单路由小程序不将这些状态写 URL。
新增、编辑和详情沿现有返回栈操作。接口错误不清空表单；离开修改过的表单须确认。
金额隐藏继承服务端设置，演示通知信息保持可见但不成为主操作。

## Async and recovery

初次加载为占位内容；初次失败显示重试；后台刷新保留已读数据并显示同步状态。
统计失败有单独重试。保存错误保留草稿；批量筛选不存在服务端写入。
现有 uni-app 遮罩、模态、选择器沿用平台键盘和焦点行为；H5 按钮具备焦点环。

## Verification and migration ledger

保留现有 API 与业务测试；执行 Vue/Sass 编译、designmd lint 和 premium strict audit。
运行与交互证据记录在 subscription/docs/ui-verification.md；未完成检查必须列明，不视作通过。
从层叠样式迁移为 token + 主样式文件；新增 UI 复用既有组件，不再追加重复页面主题。
