# 微信小程序发行失败诊断

时间：2026-10-13（Asia/Shanghai）

## 现象

项目 `subscription` 编译成功，随后报“服务端响应异常，请检查本地网络状况或联系客服”，最终“导出微信小程序失败”。

## 本机证据

HBuilderX 运行日志：`C:/Users/yez08/AppData/Roaming/HBuilder X/.log`。

```text
2026-10-13 12:51:05.212 [INFO:] appCheck start
2026-10-13 12:51:05.213 [INFO:] appCheck processing 20%
2026-10-13 12:51:05.871 [INFO:] appCheck finished
2026-10-13 12:51:05.875 [WARNING:] [PluginHost] { ret: 402, desc: 'Not found configurations' }
```

同一返回在 12:32:50 和 12:41:00 也出现。日志显示 IDE 已升级到 `5.26.2026091802`，更新检查返回 `No update`；安装目录名称仍包含旧版本 `5.24`。

项目为 uni-app Vue 3，目标微信小程序。DCloud AppID 为 `__UNI__788308A`，微信 AppID 为 `wx639160564da9289a`。

## 定位与限制

本地 `uniapp-extension` 的 `scanResultProcessing` 在编译后解析 appCheck 返回值。`ret` 为 0 时通过，1 时显示警告，2 时停止；其他值进入通用“服务端响应异常”分支，并删除生成目录。

因此，本次明确故障点是 appCheck 返回 `402 / Not found configurations`，不是源码编译失败。已收到应用层响应，没有证据表明此次请求超时。无法从该提示确定缺失的是账号、项目还是平台检查配置；需 DCloud 核对服务端。6 条鸿蒙兼容性提示不是触发该分支的依据。

## 可提交给 DCloud 的反馈

Windows，HBuilderX `5.26.2026091802`，uni-app Vue 3。发行微信小程序时编译成功，但 appCheck 稳定返回 `{ ret: 402, desc: 'Not found configurations' }`，导致发布目录被删除。请核对该版本、平台及上述 DCloud AppID 对应的检查配置，并确认恢复方式。

此文档仅保留诊断所需片段，未包含账号令牌或上传密钥。
