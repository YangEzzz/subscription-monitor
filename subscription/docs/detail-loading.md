# 详情页进入与加载

用户要求：点击订阅后先进入详情，在详情中显示骨架 loading。

实现：`openDetail` 立即设置目标 ID 和独立加载状态、执行原导航，再请求原详情接口。`SubscriptionDetailLoadState.vue` 使用 PageHeader、UiSkeleton、AsyncStateView，覆盖主卡、信息格、提醒计划、处理信息及底部操作的占位。加载期间不展示旧缓存详情和可提交的操作按钮；失败时显示原因、重新加载及返回入口。

在途读请求通过序号、视图、目标 ID 和账号检查防止旧响应回写；返回、切换视图、账号清理会使请求失效。详情读取不再占用全局 refresh 的 loading，后台刷新也不会阻止用户进入详情。接口与订阅字段、续费及保存等处理保持原实现。

新增测试 `tests/detail-loading.test.mjs` 覆盖即时进入、后台刷新并行、返回后迟到响应、新旧请求竞争、失败重试与返回栈、账号清理。已并入 `pnpm --dir subscription test`。

验证：53 项单元测试、4 项本机 HTTP 集成通过；Edge 专项测试人为挂起请求后确认详情导航和骨架已经显示，验证缓存被遮挡、返回不被迟到响应打断、503 错误和重试恢复，pageerror=0。原个人端 UI 流程回归通过。另覆盖登录失效时仍显示错误而非缓存内容。H5 与 mp-weixin 已编译，尚未在微信真机执行。

截图：[骨架状态](../.preview/detail-loading-skeleton.png)、[失败和重试](../.preview/detail-loading-error.png)。专项脚本 `.preview/check-detail-loading.cjs` 使用隔离内存后端，无线上数据或真实付款。

strict 静态审计仍为 52 项既有按钮事件识别问题，canonical unresolved=0；原始报告 `.preview/detail-loading-audit.json`，未声称静态审计通过。

## 连接等待排查与修正

用户提供的 Timing 图总计 28.96 秒，其中 Stalled 28.13 秒、建立连接约 550ms、TTFB 280.78ms、下载不足 1ms，主要耗时在请求发出前的连接等待，不能据此归结为数据库查询耗时。

代码检查发现详情退出仅使响应序号失效，未终止原生网络请求；多次进入退出会留下在途请求。现将 RequestTask 暴露给详情加载流程，返回、改选和账号清理时真正 abort；会话等待期间取消时阻止后续发送，不再把主动取消映射为网络错误。

请求层此前未显式开启微信 HTTP/2。对线上域名进行不携带凭证的 TLS/ALPN 握手，实测支持 h2，握手约 697ms；现仅在微信平台开启 enableHttp2，H5 继续由浏览器协商协议。没有改变接口地址、登录凭证、超时时间或业务参数。

57 项单元与4项 HTTP 集成通过，包含原生 abort、会话等待期间取消、HTTP/2 参数传递和原有登录/写入行为。以上修正消除了已确认的请求生命周期缺陷，但尚未在用户那次慢请求的实际连接环境中复测，因此不声称已经证明 28 秒等待的唯一原因或已确认线上耗时恢复。

最终 H5/微信构建通过，微信产物确认包含 `enableHttp2: true`。浏览器专项 `.preview/check-detail-cancel.cjs` 观察到返回详情时的原生请求 `ERR_ABORTED`，证明实际终止请求；个人端原有 UI 回归通过，pageerror=0。
