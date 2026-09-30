import test from 'node:test'
import assert from 'node:assert/strict'
import { requestNotificationAuthorization, syncPendingAuthorization } from '../api/notifications.js'
import { remoteComputed, remoteMethods } from '../pages/subscription/subscription-remote.js'

test('long-term notification states show authorization, pause and failure without a credit counter', () => {
  const page = { notifications: { configured: true, schedulerEnabled: true, identityLinked: true, subscriptionType: 'long_term', authorized: true, credits: null }, settings: { notificationEnabled: true } }
  Object.defineProperty(page, 'notificationAuthorized', { get: () => remoteComputed.notificationAuthorized.call(page) })
  assert.equal(remoteComputed.notificationReady.call(page), true)
  assert.match(remoteComputed.notificationDescription.call(page), /已开启长期提醒/)
  page.settings.notificationEnabled = false
  assert.equal(remoteComputed.notificationReady.call(page), false)
  assert.match(remoteComputed.notificationDescription.call(page), /长期授权已保留/)
  page.notifications.authorized = false
  assert.match(remoteComputed.notificationDescription.call(page), /点击授权长期提醒/)
  page.notificationError = 'offline'
  assert.match(remoteComputed.notificationDescription.call(page), /重新加载/)
})

test('resuming existing long-term authorization does not open another native authorization dialog', async () => {
  let resumed = false
  globalThis.uni = { getStorageSync: () => ({ accessToken: 'token', expiresAt: '2099-01-01T00:00:00Z', user: { id: 'user' } }), requestSubscribeMessage() { assert.fail('should reuse existing authorization') } }
  const page = { currentUserId: 'user', dataReady: true, notificationAuthorized: true, notifications: { configured: true, schedulerEnabled: true, subscriptionType: 'long_term' }, settings: { notificationEnabled: false }, updateSetting(key, value) { assert.equal(key, 'notificationEnabled'); resumed = value } }
  await remoteMethods.enableNotification.call(page)
  assert.equal(resumed, true)
})

test('calls native authorization immediately, persists receipts and safely retries the same request', async () => {
  const storage = new Map()
  const posts = []
  let fail = true
  let nativeCalls = 0
  globalThis.uni = {
    getStorageSync: key => key === 'renewal_wechat_session_v1' ? { accessToken: 'token', expiresAt: '2099-01-01T00:00:00Z', user: { id: 'user' } } : storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value), removeStorageSync: key => storage.delete(key),
    requestSubscribeMessage(options) { nativeCalls++; options.success({ [options.tmplIds[0]]: 'accept' }) },
    request(options) { posts.push(options.data); if (fail) options.fail({ errMsg: 'network error' }); else options.success({ statusCode: 200, data: { credits: 1, enabled: true } }) }
  }
  const promise = requestNotificationAuthorization('template', 'user')
  assert.equal(nativeCalls, 1)
  await assert.rejects(promise)
  await assert.rejects(requestNotificationAuthorization('template', 'user'))
  assert.equal(nativeCalls, 1)
  fail = false
  const status = await syncPendingAuthorization('user')
  assert.equal(status.credits, 1)
  assert.equal(posts[0].requestId, posts[1].requestId)
  assert.match(posts[0].requestId, /^[a-f0-9-]{36}$/)
  assert.equal(storage.size, 0)
})

test('never submits another account’s pending authorization', async () => {
  let removed = false
  globalThis.uni = { getStorageSync: () => ({ userId: 'old-user', data: {} }), removeStorageSync: () => { removed = true } }
  assert.equal(await syncPendingAuthorization('new-user'), null)
  assert.equal(removed, true)
})
