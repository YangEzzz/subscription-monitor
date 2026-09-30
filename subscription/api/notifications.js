import { request } from './request.js'

const PENDING_KEY = 'renewal_notification_authorization_v1'
export const notificationApi = {
  status: () => request('/notifications'),
  authorize: data => request('/notifications/authorization', { method: 'POST', data })
}
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.floor(Math.random() * 16)
  return (c === 'x' ? r : (r & 3) | 8).toString(16)
})
export async function syncPendingAuthorization(userId) {
  const pending = uni.getStorageSync?.(PENDING_KEY)
  if (!pending) return null
  if (pending.userId !== userId) { uni.removeStorageSync?.(PENDING_KEY); return null }
  try {
    const result = await notificationApi.authorize(pending.data)
    uni.removeStorageSync?.(PENDING_KEY)
    return result
  } catch (error) {
    if ([400, 422].includes(error.status)) {
      uni.removeStorageSync?.(PENDING_KEY)
      uni.showToast?.({ title: '授权记录已失效，请重新授权', icon: 'none' })
      return null
    }
    throw error
  }
}
// Call directly inside a user tap, before any awaited network request.
export function requestNotificationAuthorization(templateId, userId) {
  return new Promise((resolve, reject) => {
    if (uni.getStorageSync?.(PENDING_KEY)?.userId === userId) return reject(new Error('请先重新加载，确认上一次授权记录'))
    if (typeof uni.requestSubscribeMessage !== 'function') return reject(new Error('请在微信小程序中开启通知'))
    uni.requestSubscribeMessage({ tmplIds: [templateId], success(result) {
      const answer = result[templateId]
      if (!['accept', 'reject', 'ban'].includes(answer)) return reject(new Error('未获得通知授权，请重试'))
      const data = { requestId: uuid(), templateId, result: answer }
      uni.setStorageSync(PENDING_KEY, { userId, data })
      resolve(data)
    }, fail() { reject(new Error('通知授权未完成，可在微信设置中检查订阅消息权限')) } })
  }).then(async data => {
    const status = await syncPendingAuthorization(userId)
    if (!status) throw new Error('授权记录未保存，请重新授权')
    return { status, answer: data.result }
  })
}
