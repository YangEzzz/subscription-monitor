import test from 'node:test'
import assert from 'node:assert/strict'
import { requestNotificationAuthorization, syncPendingAuthorization } from '../api/notifications.js'

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
