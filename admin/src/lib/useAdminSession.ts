import { ref, onBeforeUnmount } from 'vue';
import { defaultAddress, getJson, adminPost } from './data';

export function useAdminSession() {
  const authenticated = ref(false);
  const configured = ref(true);
  const username = ref('');
  const checking = ref(false);
  const error = ref('');
  let version = 0;
  let controller = new AbortController();

  function expire() {
    version++;
    controller.abort();
    authenticated.value = false;
    username.value = '';
    error.value = '会话已失效，请重新登录。';
  }
  async function check() {
    const generation = ++version;
    controller.abort();
    controller = new AbortController();
    checking.value = true;
    error.value = '';
    try {
      const result = await getJson<{
        configured: boolean;
        authenticated: boolean;
        username: string | null;
      }>(defaultAddress(), 'session', controller.signal);
      if (generation !== version) return;
      if (
        typeof result.authenticated !== 'boolean' ||
        typeof result.configured !== 'boolean'
      )
        throw new Error('登录服务响应异常。');
      configured.value = result.configured;
      authenticated.value = result.authenticated;
      username.value = result.username || '';
    } catch (reason) {
      if (generation === version)
        error.value =
          reason instanceof Error ? reason.message : '无法连接登录服务。';
    } finally {
      if (generation === version) checking.value = false;
    }
  }
  async function login(account: string, password: string) {
    const generation = ++version;
    controller.abort();
    controller = new AbortController();
    checking.value = true;
    error.value = '';
    try {
      const result = await adminPost<{
        authenticated: boolean;
        username: string;
      }>(
        defaultAddress(),
        'login',
        { username: account, password },
        controller.signal,
      );
      if (generation !== version) return;
      if (!result.authenticated || !result.username)
        throw new Error('登录服务响应异常。');
      authenticated.value = true;
      username.value = result.username;
    } catch (reason) {
      if (generation === version)
        error.value =
          reason instanceof Error ? reason.message : '登录失败，请重试。';
    } finally {
      if (generation === version) checking.value = false;
    }
  }
  async function logout() {
    checking.value = true;
    error.value = '';
    try {
      await adminPost(
        defaultAddress(),
        'logout',
        {},
        new AbortController().signal,
      );
      authenticated.value = false;
      username.value = '';
    } catch (reason) {
      error.value =
        reason instanceof Error ? reason.message : '退出失败，请重试。';
    } finally {
      checking.value = false;
    }
  }
  void check();
  onBeforeUnmount(() => {
    version++;
    controller.abort();
  });
  return {
    authenticated,
    configured,
    username,
    checking,
    error,
    check,
    login,
    logout,
    expire,
  };
}
